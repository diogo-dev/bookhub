/**
 * Enriquecimento do catálogo com IA (ideia 1 do LANGCHAIN.md).
 *
 * Para cada livro incompleto (sem categoria Dewey, sem gêneros ou sem descrição),
 * pede ao Claude:
 *   - os gêneros literários (preferindo os que já existem no acervo);
 *   - a classe Dewey de 3 dígitos (validada contra a tabela dewey_category);
 *   - uma sinopse curta em PT-BR (apenas quando o livro não tem descrição).
 *
 * Só preenche o que está faltando: nunca sobrescreve categoria, gêneros ou descrição existentes.
 * Cada livro processado é registrado em `book_enrichment`, então o script pode ser
 * interrompido e executado de novo sem reprocessar livros.
 *
 * Uso:
 *   npm run enrich-books -- [--limit N] [--concurrency N] [--isbn ISBN] [--dry-run] [--retry-failed]
 *
 * Requer ANTHROPIC_API_KEY no .env e a migration de `book_enrichment` aplicada (npm run migrate:up).
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { client } from "../infra/pg/connection";
import { Genre } from "../domain/Genre";

const MODEL = "claude-opus-5-5";
const GENRE_VOCABULARY_SIZE = 150;
const MAX_GENRES = 4;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Options {
  limit: number | null;
  concurrency: number;
  isbn: string | null;
  dryRun: boolean;
  retryFailed: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { limit: null, concurrency: 4, isbn: null, dryRun: false, retryFailed: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`Valor ausente para ${arg}`);
      return value;
    };

    switch (arg) {
      case "--limit": options.limit = positiveInt(next(), arg); break;
      case "--concurrency": options.concurrency = positiveInt(next(), arg); break;
      case "--isbn": options.isbn = next(); break;
      case "--dry-run": options.dryRun = true; break;
      case "--retry-failed": options.retryFailed = true; break;
      default: throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }

  return options;
}

function positiveInt(value: string, flag: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${flag} precisa ser um inteiro positivo`);
  return n;
}

// ---------------------------------------------------------------------------
// Banco de dados
// ---------------------------------------------------------------------------

interface IncompleteBook {
  isbn: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  publisher: string | null;
  language: string | null;
  authors: string[];
  existingGenres: string[];
  hasCategory: boolean;
}

function needsSynopsis(book: IncompleteBook): boolean {
  return !book.description || book.description.trim() === "";
}

async function loadDeweyCategories(): Promise<Map<string, { id: string; name: string }>> {
  const result = await client.query(
    "SELECT id, decimal, name FROM dewey_category WHERE level = 2 ORDER BY decimal;"
  );
  return new Map(result.rows.map(row => [row.decimal, { id: row.id, name: row.name }]));
}

async function loadGenreVocabulary(): Promise<string[]> {
  const result = await client.query(
    `SELECT g.display_name
     FROM genre g
     JOIN book_genre bg ON bg.genre = g.name
     GROUP BY g.name, g.display_name
     ORDER BY COUNT(*) DESC, g.name
     LIMIT $1;`,
    [GENRE_VOCABULARY_SIZE]
  );
  return result.rows.map(row => row.display_name);
}

async function findIncompleteBooks(options: Options): Promise<IncompleteBook[]> {
  const params: unknown[] = [];
  const filters: string[] = [
    `(b.category_id IS NULL
      OR coalesce(trim(b.description), '') = ''
      OR NOT EXISTS (SELECT 1 FROM book_genre bg WHERE bg.book_isbn = b.isbn))`,
  ];

  if (options.isbn) {
    params.push(options.isbn);
    filters.push(`b.isbn = $${params.length}`);
  } else if (options.retryFailed) {
    filters.push(`NOT EXISTS (SELECT 1 FROM book_enrichment be WHERE be.book_isbn = b.isbn AND be.status <> 'failed')`);
  } else {
    filters.push(`NOT EXISTS (SELECT 1 FROM book_enrichment be WHERE be.book_isbn = b.isbn)`);
  }

  let limitClause = "";
  if (options.limit) {
    params.push(options.limit);
    limitClause = `LIMIT $${params.length}`;
  }

  const result = await client.query(
    `SELECT
       b.isbn,
       b.title,
       b.subtitle,
       b.description,
       b.publisher_name AS publisher,
       l.name AS language,
       b.category_id IS NOT NULL AS has_category,
       coalesce(
         (SELECT array_agg(a.name ORDER BY a.name)
          FROM book_author ba JOIN author a ON a.id = ba.author_id
          WHERE ba.book_isbn = b.isbn),
         '{}'
       ) AS authors,
       coalesce(
         (SELECT array_agg(g.display_name ORDER BY g.name)
          FROM book_genre bg JOIN genre g ON g.name = bg.genre
          WHERE bg.book_isbn = b.isbn),
         '{}'
       ) AS existing_genres
     FROM book b
     LEFT JOIN language l ON l.iso_code = b.language_code
     WHERE ${filters.join(" AND ")}
     ORDER BY b.number_of_visits DESC, b.isbn
     ${limitClause};`,
    params
  );

  return result.rows.map(row => ({
    isbn: row.isbn,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    publisher: row.publisher,
    language: row.language,
    authors: row.authors,
    existingGenres: row.existing_genres,
    hasCategory: row.has_category,
  }));
}

type EnrichmentStatus = "enriched" | "skipped" | "failed";

async function recordEnrichment(isbn: string, status: EnrichmentStatus, detail: string | null) {
  await client.query(
    `INSERT INTO book_enrichment (book_isbn, status, model, detail, enriched_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (book_isbn) DO UPDATE
       SET status = EXCLUDED.status, model = EXCLUDED.model,
           detail = EXCLUDED.detail, enriched_at = EXCLUDED.enriched_at;`,
    [isbn, status, MODEL, detail, Date.now()]
  );
}

interface AppliedChanges {
  category: string | null;
  genres: string[];
  synopsis: boolean;
}

/** Grava apenas os campos que ainda estão vazios, numa transação por livro. */
async function applyEnrichment(
  book: IncompleteBook,
  enrichment: Enrichment,
  dewey: Map<string, { id: string; name: string }>
): Promise<AppliedChanges> {
  const applied: AppliedChanges = { category: null, genres: [], synopsis: false };

  await client.query("BEGIN;");
  try {
    if (!book.hasCategory && enrichment.deweyCode) {
      const category = dewey.get(enrichment.deweyCode);
      if (category) {
        const result = await client.query(
          "UPDATE book SET category_id = $2 WHERE isbn = $1 AND category_id IS NULL;",
          [book.isbn, category.id]
        );
        if (result.rowCount) applied.category = enrichment.deweyCode;
      }
    }

    if (book.existingGenres.length === 0) {
      for (const displayName of enrichment.genres.slice(0, MAX_GENRES)) {
        const genre = new Genre();
        genre.displayName = displayName.trim();
        if (!genre.name) continue;

        await client.query(
          "INSERT INTO genre (name, display_name) VALUES ($1, $2) ON CONFLICT DO NOTHING;",
          [genre.name, genre.displayName]
        );
        await client.query(
          "INSERT INTO book_genre (book_isbn, genre) VALUES ($1, $2) ON CONFLICT DO NOTHING;",
          [book.isbn, genre.name]
        );
        applied.genres.push(genre.displayName);
      }
    }

    if (needsSynopsis(book) && enrichment.synopsisPt) {
      const result = await client.query(
        "UPDATE book SET description = $2 WHERE isbn = $1 AND coalesce(trim(description), '') = '';",
        [book.isbn, enrichment.synopsisPt.trim()]
      );
      applied.synopsis = (result.rowCount ?? 0) > 0;
    }

    const changed = applied.category !== null || applied.genres.length > 0 || applied.synopsis;
    await recordEnrichment(
      book.isbn,
      changed ? "enriched" : "skipped",
      changed ? null : "modelo não identificou dados confiáveis"
    );

    await client.query("COMMIT;");
  } catch (error) {
    await client.query("ROLLBACK;");
    throw error;
  }

  return applied;
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------

const EnrichmentSchema = z.object({
  genres: z
    .array(z.string())
    .describe(`De 1 a ${MAX_GENRES} gêneros literários, em inglês, preferindo os da lista de gêneros existentes`),
  deweyCode: z
    .string()
    .nullable()
    .describe("Código Dewey de 3 dígitos da lista fornecida, ou null se não for possível classificar com confiança"),
  synopsisPt: z
    .string()
    .nullable()
    .describe("Sinopse curta em português do Brasil, ou null se não foi pedida ou se você não conhece o livro"),
});

type Enrichment = z.infer<typeof EnrichmentSchema>;

function buildSystemPrompt(dewey: Map<string, { id: string; name: string }>, genres: string[]): string {
  const deweyList = Array.from(dewey.entries())
    .map(([code, { name }]) => `${code} ${name}`)
    .join("\n");

  return `Você é um bibliotecário catalogador do BookHub, o sistema de uma biblioteca brasileira. \
Você recebe os metadados de um livro (vindos do OpenLibrary, muitas vezes incompletos) e devolve dados de catalogação.

Regras:
- Gêneros: escolha de 1 a ${MAX_GENRES} gêneros que descrevam o livro. Prefira sempre nomes da lista de gêneros existentes, \
escritos exatamente como nela, para manter o acervo consistente. Só crie um gênero novo se nenhum da lista servir; \
nesse caso use inglês, sem acentos nem pontuação, no mesmo estilo da lista.
- Classe Dewey: devolva exatamente um dos códigos de 3 dígitos da tabela abaixo. Se os metadados não permitirem \
uma classificação razoável, devolva null.
- Sinopse: escreva somente quando o pedido disser que o livro não tem descrição. Use português do Brasil, \
de 2 a 4 frases, em tom neutro de catálogo, sem spoilers do final. Escreva apenas sobre o que você realmente sabe \
deste livro (pelos metadados ou por conhecê-lo); se não conhecer a obra o suficiente, devolva null em vez de inventar. \
Quando a sinopse não for pedida, devolva null.

<generos_existentes>
${genres.join("\n")}
</generos_existentes>

<tabela_dewey>
${deweyList}
</tabela_dewey>`;
}

function buildUserPrompt(book: IncompleteBook): string {
  const lines = [
    `Título: ${book.title}`,
    book.subtitle ? `Subtítulo: ${book.subtitle}` : null,
    book.authors.length ? `Autores: ${book.authors.join(", ")}` : null,
    book.publisher ? `Editora: ${book.publisher}` : null,
    book.language ? `Idioma: ${book.language}` : null,
    `ISBN: ${book.isbn}`,
    needsSynopsis(book)
      ? "Descrição: (o livro não tem descrição; escreva a sinopse se conhecer a obra)"
      : `Descrição: ${book.description}`,
  ];

  return `<livro>\n${lines.filter(Boolean).join("\n")}\n</livro>`;
}

class EnrichmentError extends Error {}

async function enrichBook(anthropic: Anthropic, systemPrompt: string, book: IncompleteBook): Promise<Enrichment> {
  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    // Tarefa de classificação simples: esforço baixo reduz custo e latência.
    output_config: {
      effort: "low",
      format: betaZodOutputFormat(EnrichmentSchema),
    },
    // Se o classificador de segurança recusar, a API repete a chamada num modelo de fallback.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // O prompt de sistema (tabela Dewey + gêneros) é igual para todos os livros: fica em cache.
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserPrompt(book) }],
  });

  if (response.stop_reason === "refusal") {
    throw new EnrichmentError(`recusado (${response.stop_details?.category ?? "sem categoria"})`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new EnrichmentError("resposta truncada (max_tokens)");
  }
  if (!response.parsed_output) {
    throw new EnrichmentError("resposta fora do formato esperado");
  }

  return response.parsed_output;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const anthropic = new Anthropic({ maxRetries: 5 });

  console.log("🤖 Enriquecimento do catálogo com IA");
  console.log(`   modelo: ${MODEL} | concorrência: ${options.concurrency}${options.dryRun ? " | DRY RUN (nada será gravado)" : ""}\n`);

  const dewey = await loadDeweyCategories();
  if (dewey.size === 0) throw new Error("Tabela dewey_category vazia: rode as migrations antes.");

  const genreVocabulary = await loadGenreVocabulary();
  const systemPrompt = buildSystemPrompt(dewey, genreVocabulary);

  const books = await findIncompleteBooks(options);
  console.log(`📚 ${books.length} livros incompletos a processar\n`);
  if (books.length === 0) return;

  const stats = { enriched: 0, skipped: 0, failed: 0, categories: 0, genres: 0, synopses: 0 };
  let processed = 0;
  let next = 0;

  // As chamadas ao modelo rodam em paralelo; as gravações compartilham um único pg.Client,
  // então são serializadas por esta fila para que as transações não se misturem.
  let writeQueue: Promise<unknown> = Promise.resolve();
  const serialized = <T>(fn: () => Promise<T>): Promise<T> => {
    const result = writeQueue.then(fn);
    writeQueue = result.catch(() => undefined);
    return result;
  };

  async function worker() {
    while (next < books.length) {
      const book = books[next++];
      const label = `${book.isbn} "${book.title}"`;

      try {
        const enrichment = await enrichBook(anthropic, systemPrompt, book);

        if (options.dryRun) {
          console.log(`  • ${label}\n    ${JSON.stringify(enrichment)}`);
          stats.enriched++;
        } else {
          const applied = await serialized(() => applyEnrichment(book, enrichment, dewey));
          const changed = applied.category !== null || applied.genres.length > 0 || applied.synopsis;

          if (changed) stats.enriched++;
          else stats.skipped++;
          if (applied.category) stats.categories++;
          if (applied.synopsis) stats.synopses++;
          stats.genres += applied.genres.length;

          if (enrichment.deweyCode && !dewey.has(enrichment.deweyCode) && !book.hasCategory) {
            console.warn(`  ⚠️  ${label}: código Dewey inválido "${enrichment.deweyCode}" ignorado`);
          }
        }
      } catch (error) {
        stats.failed++;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ ${label}: ${message}`);

        if (!options.dryRun) {
          await serialized(() => recordEnrichment(book.isbn, "failed", message)).catch(recordError =>
            console.error(`  ✗ não foi possível registrar a falha de ${book.isbn}:`, recordError)
          );
        }

        // Erros de autenticação/permissão não melhoram tentando outros livros.
        if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
          next = books.length;
        }
      }

      processed++;
      if (processed % 25 === 0 || processed === books.length) {
        console.log(`  … ${processed}/${books.length} processados`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(options.concurrency, books.length) }, worker));
  await writeQueue;

  console.log("\n✅ Processo concluído!");
  console.log(`  ✓ ${stats.enriched} livros enriquecidos${options.dryRun ? " (simulação)" : ""}`);
  if (!options.dryRun) {
    console.log(`    - ${stats.categories} categorias Dewey, ${stats.genres} gêneros, ${stats.synopses} sinopses`);
    console.log(`  - ${stats.skipped} livros sem dados confiáveis (marcados como skipped)`);
  }
  if (stats.failed > 0) {
    console.log(`  ✗ ${stats.failed} falhas${options.dryRun ? "" : " (rode novamente com --retry-failed)"}`);
  }
}

main()
  .catch(error => {
    console.error("\n❌ Erro no enriquecimento:", error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
