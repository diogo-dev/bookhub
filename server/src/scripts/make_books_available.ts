import { client } from "../infra/pg/connection";

async function makeBooksAvailable() {
  try {
    const statsBefore = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM book_item
      GROUP BY status
      ORDER BY count DESC;
    `);

    console.log("Status atual dos itens:");
    for (const row of statsBefore.rows) {
      const status = row.status || "NULL";
      const count = parseInt(row.count);
      console.log(`  ${status}: ${count} itens`);
    }

    const nullUpdate = await client.query(`
      UPDATE book_item 
      SET status = 'disponivel' 
      WHERE status IS NULL;
    `);

    const unavailableUpdate = await client.query(`
      UPDATE book_item 
      SET status = 'disponivel' 
      WHERE status = 'indisponivel' 
        AND id NOT IN (
          SELECT DISTINCT item_id 
          FROM loan 
          WHERE status = 'ativo' AND returned_at IS NULL
        )
        AND id NOT IN (
          SELECT DISTINCT item_id 
          FROM reservation 
          WHERE end_at > EXTRACT(EPOCH FROM NOW())
        );
    `);

    const statsAfter = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM book_item
      GROUP BY status
      ORDER BY count DESC;
    `);

    console.log("\nStatus após atualização:");
    for (const row of statsAfter.rows) {
      const status = row.status || "NULL";
      const count = parseInt(row.count);
      console.log(`  ${status}: ${count} itens`);
    }

    const totalUpdated = (nullUpdate.rowCount || 0) + (unavailableUpdate.rowCount || 0);
    console.log(`\n${totalUpdated} itens atualizados para 'disponivel'.`);

  } catch (error) {
    console.error("Erro ao atualizar status dos livros:", error);
    throw error;
  } finally {
    await client.end();
  }
}

makeBooksAvailable();
