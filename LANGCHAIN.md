# LangChain no BookHub

Este documento reúne uma introdução ao LangChain e propostas de como usá-lo no BookHub.

## Sumário

- [O que é o LangChain](#o-que-é-o-langchain)
- [Pacotes para o BookHub](#pacotes-para-o-bookhub)
- [Ideias de uso](#ideias-de-uso)
  - [1. Enriquecer o catálogo](#1-enriquecer-o-catálogo)
  - [2. Busca semântica (RAG)](#2-busca-semântica-rag)
  - [3. Recomendações personalizadas](#3-recomendações-personalizadas)
  - [4. Assistente de biblioteca (agente com tools)](#4-assistente-de-biblioteca-agente-com-tools)
- [Como encaixar na arquitetura](#como-encaixar-na-arquitetura)
- [Vale a pena usar o LangChain?](#vale-a-pena-usar-o-langchain)
- [Roadmap sugerido](#roadmap-sugerido)

---

## O que é o LangChain

O LangChain é um framework open source (com versões em Python e em JavaScript/TypeScript) para construir aplicações com LLMs. O modelo em si não vem dele: ele fornece abstrações e integrações em volta do modelo.

| Conceito | O que faz |
|---|---|
| **Chat models** | Interface única para vários provedores (`ChatAnthropic`, `ChatOpenAI`, …). Dá para trocar de modelo sem reescrever o código. |
| **Prompts / Runnables (LCEL)** | Templates de prompt e composição de etapas com `.pipe()`: prompt → modelo → parser. |
| **Structured output** | `.withStructuredOutput(schemaZod)` devolve um objeto tipado em vez de texto livre. |
| **Tools + Agents** | Você expõe funções suas (ex.: "buscar livro") e o modelo decide quando chamá-las. O loop de agente roda no **LangGraph**, que faz parte do mesmo ecossistema. |
| **Embeddings + Vector stores + Retrievers** | Base do RAG (busca semântica). Tem integração com **PGVector**, o que combina bem com o PostgreSQL do projeto. |
| **Document loaders / Text splitters** | Ingestão de PDFs, CSVs, JSONL etc. |
| **LangSmith** | Serviço separado e opcional para tracing e avaliação das chamadas. |

## Pacotes para o BookHub

O backend do BookHub é Node + Express + TypeScript, então a versão a usar é a **LangChain.js**:

```bash
cd server
npm install langchain @langchain/core @langchain/anthropic @langchain/langgraph
# para busca semântica (ideia 2):
npm install @langchain/community
```

A chave da API fica no `.env` (ex.: `ANTHROPIC_API_KEY`) e deve ser lida em `src/config/env.ts`, como as outras variáveis de ambiente.

> **Observação:** nos modelos Claude mais recentes, parâmetros de amostragem como `temperature` não são aceitos. Não configure `temperature` no `ChatAnthropic`.

---

## Ideias de uso

### 1. Enriquecer o catálogo

**Problema:** muitos livros importados do OpenLibrary (`server/src/infra/openLibrary/data/books.jsonl`) chegam com `genres: []`, `category: null` e `description: ""`, o que prejudica os carrosséis por categoria e os filtros.

**Proposta:** um script em `server/src/scripts/` que, para cada livro incompleto, pede ao modelo:
- os gêneros literários;
- a classe Dewey (a tabela já existe em `server/src/migrations/1760964335612_add-dewey-categories.ts`);
- uma sinopse curta em PT-BR.

Isso usa structured output com `zod`, que o projeto já tem:

```ts
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

const model = new ChatAnthropic({ model: "claude-opus-5-5" });

const Enrichment = z.object({
  genres: z.array(z.string()).describe("Gêneros literários"),
  deweyCode: z.string().describe("Código Dewey de 3 dígitos"),
  synopsisPt: z.string().describe("Sinopse curta em português"),
});

const enricher = model.withStructuredOutput(Enrichment);

const result = await enricher.invoke(
  `Título: ${book.title}\n` +
  `Subtítulo: ${book.subtitle}\n` +
  `Autores: ${authors}\n` +
  `Descrição: ${book.description}`
);
// result.genres, result.deweyCode, result.synopsisPt já validados pelo zod
```

**Cuidados:**
- Validar o `deweyCode` contra a tabela de categorias antes de salvar.
- Processar em lotes e registrar quais livros já foram enriquecidos, para poder retomar o script.
- Pode virar um comando no `package.json` (ex.: `npm run enrich-books`), no mesmo padrão de `populate` e `add-items-to-books`.

**Vantagem:** baixo risco, roda offline (fora do fluxo de requisições) e melhora funcionalidades que já existem.

### 2. Busca semântica (RAG)

**Situação atual:** a busca é full-text com `tsvector` e trigram (`server/src/migrations/1760826003471_add-text-search.ts`). Ela funciona bem para títulos e termos exatos, mas não entende pedidos como *"um suspense psicológico parecido com Garota Exemplar"*.

**Proposta:**
1. Habilitar a extensão `pgvector` no PostgreSQL por meio de uma migration.
2. Gerar embeddings de `título + subtítulo + descrição + gêneros` e guardá-los com o `PGVectorStore` do LangChain.
3. Fazer uma **busca híbrida**: full-text para termos exatos e similaridade vetorial para o significado, combinando os rankings.

```ts
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

const store = await PGVectorStore.initialize(embeddings, {
  postgresConnectionOptions: { /* mesma config de src/infra/pg/connection.ts */ },
  tableName: "book_embedding",
});

const results = await store.similaritySearch("suspense psicológico com narradora não confiável", 10);
```

**Observação:** a Anthropic não oferece modelo de embeddings, então essa parte precisaria de outro provedor (Voyage AI, OpenAI ou um modelo local). É aqui que a abstração do LangChain mais ajuda, porque trocar o provedor de embeddings vira uma linha de configuração.

### 3. Recomendações personalizadas

**Proposta:** usar a wishlist (`InterestService`) e o histórico de empréstimos (`LoanService`) do usuário para:
1. buscar livros próximos no espaço vetorial (reaproveitando a ideia 2);
2. pedir ao LLM que escolha os melhores e explique cada recomendação ("porque você leu X").

Pode alimentar uma seção "Recomendados para você" na home. Para controlar custo, as recomendações podem ser geradas periodicamente com `node-cron` (que já é dependência do projeto) em vez de a cada acesso.

### 4. Assistente de biblioteca (agente com tools)

**Proposta:** um chat em que o leitor pergunta, por exemplo, *"tem algum livro do Stephen King disponível? reserva pra mim"*. Os services existentes viram tools:

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const searchBooks = tool(
  async ({ query }) => JSON.stringify(await bookService.search(query)),
  {
    name: "search_books",
    description: "Busca livros no acervo por título, autor ou tema",
    schema: z.object({ query: z.string() }),
  }
);

// Outras tools possíveis:
// - check_availability(isbn): verifica se há exemplares disponíveis
// - reserve_book(isbn): cria uma reserva para o usuário autenticado
// - list_my_loans(): lista os empréstimos do usuário
```

O loop do agente (o modelo chama uma tool, recebe o resultado e decide o próximo passo) fica por conta do LangGraph.

**Cuidados de segurança:**
- Ações como reservar devem usar o usuário autenticado pelo `server/src/auth/middleware.ts`, **nunca** um `userId` escolhido pelo modelo.
- Ações administrativas (empréstimo, devolução, edição de livros) **não** devem ser expostas ao assistente do leitor.
- Pedir confirmação na interface antes de ações que alteram dados (ex.: "Confirmar reserva de *It Ends With Us*?").

---

## Como encaixar na arquitetura

Seguindo o padrão atual do `server/src/container.ts`:

```
server/src/
├── infra/
│   └── llm/
│       ├── model.ts          # instância do ChatAnthropic e configuração
│       └── embeddings.ts     # provedor de embeddings (ideia 2)
├── services/
│   ├── AIEnrichmentService.ts
│   ├── SemanticSearchService.ts
│   ├── RecommendationService.ts
│   └── LibraryAssistantService.ts
├── controllers/
│   └── assistantController.ts
└── scripts/
    └── enrich_books.ts
```

Os services novos são instanciados e injetados no `container.ts` como os demais, recebendo os repositórios e services existentes por construtor.

---

## Vale a pena usar o LangChain?

| Use o LangChain se… | Prefira o SDK oficial (`@anthropic-ai/sdk`) se… |
|---|---|
| For fazer RAG ou busca semântica (vector store, retrievers, loaders) | For fazer só chamadas pontuais, como a ideia 1 |
| Quiser poder trocar de provedor de modelo ou de embeddings | Quiser menos dependências e acesso direto a todos os parâmetros da API |
| For montar agentes com várias tools e fluxos com estado (LangGraph) | Quiser usar recursos novos da API assim que forem lançados |

O LangChain adiciona uma camada de abstração que facilita integrações, mas às vezes atrasa ou esconde parâmetros específicos de cada modelo.

---

## Roadmap sugerido

1. **Enriquecimento do catálogo** (ideia 1): baixo risco, roda offline e melhora categorias e filtros já existentes.
2. **Busca semântica** (ideia 2): é aqui que o LangChain passa a compensar de verdade.
3. **Recomendações** (ideia 3): reaproveita os embeddings da etapa 2.
4. **Assistente de biblioteca** (ideia 4): o mais complexo, que exige cuidado com autorização e UX de confirmação.
