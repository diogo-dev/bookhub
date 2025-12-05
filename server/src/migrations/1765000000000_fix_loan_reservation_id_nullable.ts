import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
    // Primeiro, remover a foreign key constraint existente
    // Precisamos encontrar o nome da constraint primeiro
    const constraintResult = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'loan' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%reservation%';
    `);

    if (constraintResult.rows.length > 0) {
        const constraintName = constraintResult.rows[0].constraint_name;
        await client.query(`
            ALTER TABLE loan 
            DROP CONSTRAINT IF EXISTS ${constraintName};
        `);
    }

    // Verificar se a coluna tem NOT NULL antes de tentar remover
    const columnInfo = await client.query(`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'loan' 
        AND column_name = 'reservation_id';
    `);

    // Se a coluna não permite NULL, remover a constraint
    if (columnInfo.rows.length > 0 && columnInfo.rows[0].is_nullable === 'NO') {
        await client.query(`
            ALTER TABLE loan 
            ALTER COLUMN reservation_id DROP NOT NULL;
        `);
    }

    // Verificar se a constraint já existe antes de criar
    const existingConstraint = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'loan' 
        AND constraint_name = 'loan_reservation_id_fkey';
    `);

    // Recriar a foreign key permitindo NULL apenas se não existir
    if (existingConstraint.rows.length === 0) {
        await client.query(`
            ALTER TABLE loan 
            ADD CONSTRAINT loan_reservation_id_fkey 
            FOREIGN KEY (reservation_id) 
            REFERENCES reservation(id) 
            ON DELETE CASCADE;
        `);
    }
});

export const down = transaction(async (client: Client) => {
    // Remover a foreign key
    await client.query(`
        ALTER TABLE loan 
        DROP CONSTRAINT IF EXISTS loan_reservation_id_fkey;
    `);

    // Remover empréstimos sem reserva antes de reverter
    await client.query(`
        DELETE FROM loan WHERE reservation_id IS NULL;
    `);

    // Recriar a foreign key original com NOT NULL
    await client.query(`
        ALTER TABLE loan 
        ALTER COLUMN reservation_id SET NOT NULL;
    `);

    await client.query(`
        ALTER TABLE loan 
        ADD CONSTRAINT loan_reservation_id_fkey 
        FOREIGN KEY (reservation_id) 
        REFERENCES reservation(id) 
        ON DELETE CASCADE;
    `);
});

