import { client } from "../infra/pg/connection";

async function makeAllBooksAvailable() {
  try {
    console.log("Este script irá forçar TODOS os itens para 'disponivel'");
    console.log("mesmo aqueles que estão emprestados ou reservados.\n");

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

    const activeLoans = await client.query(`
      SELECT COUNT(DISTINCT item_id) as count
      FROM loan
      WHERE status = 'ativo' AND returned_at IS NULL;
    `);

    const activeReservations = await client.query(`
      SELECT COUNT(DISTINCT item_id) as count
      FROM reservation
      WHERE end_at > EXTRACT(EPOCH FROM NOW());
    `);

    const activeLoansCount = parseInt(activeLoans.rows[0].count);
    const activeReservationsCount = parseInt(activeReservations.rows[0].count);

    if (activeLoansCount > 0 || activeReservationsCount > 0) {
      console.log("\nAVISO:");
      if (activeLoansCount > 0) {
        console.log(`  ${activeLoansCount} itens estão emprestados atualmente`);
      }
      if (activeReservationsCount > 0) {
        console.log(`  ${activeReservationsCount} itens estão reservados atualmente`);
      }
      console.log("  Estes itens também serão marcados como 'disponivel'.\n");
    }

    const updateResult = await client.query(`
      UPDATE book_item 
      SET status = 'disponivel';
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

    console.log(`\n${updateResult.rowCount} itens atualizados para 'disponivel'.`);

  } catch (error) {
    console.error("Erro ao atualizar status dos livros:", error);
    throw error;
  } finally {
    await client.end();
  }
}

makeAllBooksAvailable();
