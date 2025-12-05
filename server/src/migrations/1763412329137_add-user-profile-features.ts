import {transaction} from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => { 

    await client.query(`
        ALTER TABLE book_item 
        ADD COLUMN status VARCHAR(20) DEFAULT 'disponivel'
        CHECK (status IN ('disponivel', 'emprestado', 'indisponivel', 'reservado'));
    `);

    await client.query(`
        UPDATE book_item 
        SET status = 'disponivel' 
        WHERE status IS NULL;
    `);

    await client.query(`
        CREATE TABLE user_interest (
        user_id UUID NOT NULL,
        book_isbn VARCHAR(13) NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW())),
        PRIMARY KEY (user_id, book_isbn),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_isbn) REFERENCES book(isbn) ON DELETE CASCADE
        );
    `);

    await client.query(`
       CREATE TABLE reservation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID NOT NULL,
        item_id UUID NOT NULL,
        start_at BIGINT NOT NULL,
        end_at BIGINT NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW())),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES book_item(id) ON DELETE CASCADE
       ); 
    `);

    await client.query(`
        CREATE TABLE loan (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         code VARCHAR(255) UNIQUE NOT NULL,
         reservation_id UUID NOT NULL,
         user_id UUID NOT NULL,
         item_id UUID NOT NULL,
         start_at BIGINT NOT NULL,
         due_at BIGINT NOT NULL,
         returned_at BIGINT,
         status VARCHAR(20) DEFAULT 'ativo'
          CHECK (status IN ('ativo', 'devolvido', 'atrasado')),
         created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW())),
         FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE,
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
         FOREIGN KEY (item_id) REFERENCES book_item(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE INDEX idx_user_interest_user_id ON user_interest(user_id);
      `);
    
    await client.query(`
    CREATE INDEX idx_user_interest_book_isbn ON user_interest(book_isbn);
    `);

    await client.query(`
    CREATE INDEX idx_reservation_user_id ON reservation(user_id);
    `);

    await client.query(`
    CREATE INDEX idx_reservation_item_id ON reservation(item_id);
    `);

    await client.query(`
    CREATE INDEX idx_reservation_code ON reservation(code);
    `);

    await client.query(`
    CREATE INDEX idx_loan_user_id ON loan(user_id);
    `);

    await client.query(`
    CREATE INDEX idx_loan_item_id ON loan(item_id);
    `);

    await client.query(`
    CREATE INDEX idx_loan_status ON loan(status);
    `);
    
    await client.query(`
    CREATE INDEX idx_loan_code ON loan(code);
    `);
});

export const down = transaction(async(client: Client) => {

    await client.query("DROP INDEX IF EXISTS idx_loan_code;");
    await client.query("DROP INDEX IF EXISTS idx_loan_status;");
    await client.query("DROP INDEX IF EXISTS idx_loan_item_id;");
    await client.query("DROP INDEX IF EXISTS idx_loan_user_id;");
    await client.query("DROP INDEX IF EXISTS idx_reservation_code;");
    await client.query("DROP INDEX IF EXISTS idx_reservation_item_id;");
    await client.query("DROP INDEX IF EXISTS idx_reservation_user_id;");
    await client.query("DROP INDEX IF EXISTS idx_user_interest_book_isbn;");
    await client.query("DROP INDEX IF EXISTS idx_user_interest_user_id;");
  
    await client.query("DROP TABLE IF EXISTS loan;");
    await client.query("DROP TABLE IF EXISTS reservation;");
    await client.query("DROP TABLE IF EXISTS user_interest;");
  
    await client.query("ALTER TABLE book_item DROP COLUMN IF EXISTS status;");
  


});