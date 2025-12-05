import { client } from "../infra/pg/connection";

async function checkBooksWithItems() {
  try {
    const totalBooks = await client.query("SELECT COUNT(*) as count FROM book;");
    console.log(`Total de livros: ${totalBooks.rows[0].count}`);

    const totalItems = await client.query("SELECT COUNT(*) as count FROM book_item;");
    console.log(`Total de itens: ${totalItems.rows[0].count}\n`);

    const booksWithItems = await client.query(`
      SELECT 
        b.isbn,
        b.title,
        COUNT(bi.id) as item_count
      FROM book b
      LEFT JOIN book_item bi ON bi.isbn = b.isbn
      GROUP BY b.isbn, b.title
      HAVING COUNT(bi.id) > 0
      ORDER BY item_count DESC
      LIMIT 10;
    `);

    console.log("Top 10 livros com mais itens:");
    for (const row of booksWithItems.rows) {
      console.log(`  ${row.isbn}: "${row.title.substring(0, 50)}..." (${row.item_count} itens)`);
    }

    const booksWithoutItems = await client.query(`
      SELECT COUNT(*) as count
      FROM book b
      LEFT JOIN book_item bi ON bi.isbn = b.isbn
      WHERE bi.id IS NULL;
    `);

    console.log(`\nLivros sem itens: ${booksWithoutItems.rows[0].count}`);

    const testISBN = process.argv[2];
    if (testISBN) {
      console.log(`\nVerificando ISBN: ${testISBN}`);
      const testBook = await client.query("SELECT * FROM book WHERE isbn = $1;", [testISBN]);
      if (testBook.rows.length === 0) {
        console.log("  Livro não encontrado no banco");
      } else {
        console.log(`  Livro encontrado: "${testBook.rows[0].title}"`);
        const testItems = await client.query("SELECT * FROM book_item WHERE isbn = $1;", [testISBN]);
        console.log(`  Itens associados: ${testItems.rows.length}`);
        if (testItems.rows.length > 0) {
          console.log("  Status dos itens:");
          const statusCount = testItems.rows.reduce((acc: any, row: any) => {
            const status = row.status || "NULL";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          for (const [status, count] of Object.entries(statusCount)) {
            console.log(`    ${status}: ${count}`);
          }
        }
      }
    }

  } catch (error) {
    console.error("Erro:", error);
    throw error;
  } finally {
    await client.end();
  }
}

checkBooksWithItems();
