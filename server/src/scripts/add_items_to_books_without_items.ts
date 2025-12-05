import { client } from "../infra/pg/connection";
import { BookItem } from "../domain/BookItem";
import { ItemRepositoryPostgresImpl } from "../repositories/impl/postgres/ItemRepositoryPostgresImpl";

async function addItemsToBooksWithoutItems() {
  const itemRepository = new ItemRepositoryPostgresImpl(client);

  try {
    console.log("📚 Verificando livros sem itens...\n");

    // Buscar livros sem itens
    const booksWithoutItems = await client.query(`
      SELECT b.isbn, b.title
      FROM book b
      LEFT JOIN book_item bi ON bi.isbn = b.isbn
      WHERE bi.id IS NULL
      ORDER BY b.isbn;
    `);

    const count = booksWithoutItems.rows.length;
    console.log(`Encontrados ${count} livros sem itens\n`);

    if (count === 0) {
      console.log("✅ Todos os livros já têm itens!");
      return;
    }

    console.log("🔄 Adicionando 1 item para cada livro sem itens...\n");

    let added = 0;
    let errors = 0;

    for (const book of booksWithoutItems.rows) {
      try {
        const item = new BookItem(book.isbn);
        await itemRepository.save(item);
        added++;
        
        if (added % 100 === 0) {
          console.log(`  ✓ ${added} itens adicionados...`);
        }
      } catch (error) {
        errors++;
        console.error(`  ✗ Erro ao adicionar item para ${book.isbn}:`, error);
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`  ✓ ${added} itens adicionados`);
    if (errors > 0) {
      console.log(`  ✗ ${errors} erros`);
    }

    // Verificar resultado
    const booksStillWithoutItems = await client.query(`
      SELECT COUNT(*) as count
      FROM book b
      LEFT JOIN book_item bi ON bi.isbn = b.isbn
      WHERE bi.id IS NULL;
    `);

    const remaining = parseInt(booksStillWithoutItems.rows[0].count);
    if (remaining > 0) {
      console.log(`\n⚠️  Ainda há ${remaining} livros sem itens`);
    } else {
      console.log(`\n✨ Todos os livros agora têm pelo menos 1 item!`);
    }

  } catch (error) {
    console.error("\n❌ Erro ao adicionar itens:", error);
    throw error;
  } finally {
    await client.end();
  }
}

addItemsToBooksWithoutItems();
