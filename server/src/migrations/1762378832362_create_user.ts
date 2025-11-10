import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {

    await client.query(`
        CREATE TABLE permission (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) UNIQUE NOT NULL,
            created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
        );
    `);

    await client.query(`
        CREATE TABLE role (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) UNIQUE NOT NULL,
            created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
        );
    `);

    await client.query(`
        CREATE TABLE role_permission (
            role_id UUID,
            permission_id UUID,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
        );
    `);

    await client.query (`
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            cpf VARCHAR(11) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
        );
    `);

    await client.query(`
        CREATE TABLE user_role (
            user_id UUID,
            role_id UUID,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
        );
    `);

});

export const down = transaction(async (client: Client) => {
    await client.query("DROP TABLE users;");
    await client.query("DROP TABLE role;");
    await client.query("DROP TABLE permission;");
    await client.query("DROP TABLE user_role;");
    await client.query("DROP TABLE role_permission;");
});