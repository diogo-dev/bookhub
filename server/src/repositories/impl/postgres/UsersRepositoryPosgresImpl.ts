import { UserAccount } from "@/domain/UserAccount";
import { Role } from "@/domain/Role";
import { Permission } from "@/domain/Permission";
import { UsersRepository } from "@/repositories/UsersRepository";
import { Client } from "pg";

export interface UsersRecord {
    id: string;
    name: string;
    email: string;
    cpf: string;
    password_hash: string;
    created_at: string;
}

export class UsersRepositoryPosgresImpl implements UsersRepository {
    constructor(private client: Client) {}

    public async save(user: UserAccount): Promise<UserAccount> {
        
        await this.client.query("BEGIN;");
        try {
            await this.client.query(
                `INSERT INTO users (id, name, cpf, email, password_hash)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
                [user.ID, user.name, user.cpf, user.email, user.password_hash]
            );

            // Inserir relações user_role
            if (user.roles && user.roles.length > 0) {
                for (const role of user.roles) {
                    await this.client.query(
                        `INSERT INTO user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
                        [user.ID, role.ID]
                    );
                }
            }

            await this.client.query("COMMIT;");
        } catch (error) {
            await this.client.query("ROLLBACK;");
            throw error;
        }

        return user;
    }

    public async findByEmail(email: string): Promise<UserAccount | null> {
        const result = await this.client.query(
            "SELECT * FROM users WHERE email = $1;",
            [email]
        );

        if (result.rows.length === 0) return null;
        return await this.deserialize(result.rows[0]);
    }

    public async findById(userID: string): Promise<UserAccount | null> {
        const result = await this.client.query(
            "SELECT * FROM users WHERE id = $1;",
            [userID]
        );

        if (result.rows.length === 0) return null;
        return await this.deserialize(result.rows[0]);
    }

    private async getRoleDetails(userID: string): Promise<{ id: string; name: string; permissions: string[] }[]> {
        // Obtém as roles e suas permissões
        const result = await this.client.query(
            `SELECT r.id, r.name, array_agg(p.name) as permissions
             FROM role r
             JOIN user_role ur ON ur.role_id = r.id
             LEFT JOIN role_permission rp ON rp.role_id = r.id
             LEFT JOIN permission p ON p.id = rp.permission_id
             WHERE ur.user_id = $1
             GROUP BY r.id, r.name;`,
            [userID]
        );

        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            permissions: row.permissions && row.permissions.filter((p: string | null) => p !== null) || []
        }));
    }

    public async getUserRoles(userID: string): Promise<{ roles: string[] }> {
        const roleDetails = await this.getRoleDetails(userID);
        return {
            roles: roleDetails.map(r => r.name)
        };
    }

    private async deserialize(record: UsersRecord): Promise<UserAccount> {
        // Buscar as roles do usuário com suas permissões
        const roleDetails = await this.getRoleDetails(record.id);
        const roles: Role[] = [];

        // Para cada role, criar as permissions e a role
        for (const roleData of roleDetails) {
            const permissions = roleData.permissions.map(
                (pname: string) => new Permission(pname)
            );
            
            roles.push(new Role(
                roleData.name,
                permissions,
                roleData.id
            ));
        }

        return new UserAccount(
            record.name,
            record.email,
            record.cpf,
            roles,
            record.password_hash,
            record.id,
            Number(record.created_at)
        );
    }

    public async updateProfile(userId: string, data: {name?: string, email?: string, password_hash?: string}): Promise<UserAccount> {

        const existingUser = await this.findById(userId);
        if (!existingUser) throw new Error('User not found');

        if (data.email && data.email !== existingUser.email) {
            const emailExists = await this.findByEmail(data.email);
            if (emailExists) throw new Error('Email already in use');
        }

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { 
            updates.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }

        if (data.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(data.email);
        }

        if (data.password_hash !== undefined) {
            updates.push(`password_hash = $${paramIndex++}`);
            values.push(data.password_hash);
        }

        if (updates.length === 0) return existingUser;

        values.push(userId);
        await this.client.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex++};`,
            values
        )

        const updateUser = await this.findById(userId);
        if (!updateUser) throw new Error('Error to found user after update');

        return updateUser;
    }
    
    public async deleteById(userId: string): Promise<void> {

        const result = await this.client.query(
            `DELETE FROM users WHERE id = $1;`,
            [userId]
        );

        if (result.rowCount === 0) throw new Error('User not found');
    }
}
