import bcrypt from "bcrypt";
import { generateToken } from "./jwt";
import { UsersRepository } from "@/repositories/UsersRepository";
import { RoleRepository } from "@/repositories/RoleRepository";
import { UserAccount } from "@/domain/UserAccount";
import { RegisterCredentials } from "@/dto/RegisterCredentials";
import { RegisterResponse } from "@/dto/RegisterResponse";
import { LoginCredentials } from "@/dto/LoginCredentials";
import { LoginResponse } from "@/dto/LoginResponse";
import { HttpError } from "@/errors/HttpError";


export class AuthService {
    constructor(private usersRepository: UsersRepository, private roleRepository: RoleRepository) {}

    async login({ email, password }: LoginCredentials): Promise<LoginResponse> {
        // 1. Buscar usuário pelo email
        const user = await this.usersRepository.findByEmail(email);
        if (!user) throw new HttpError(401, "Senha ou email inválidos");

        // 2. Verificar senha
        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) throw new HttpError(401, "Senha ou email inválidos");

        // 3. Gerar token JWT
        const token = generateToken({
            sub: user.ID,
            name: user.name,
            email: user.email,
            roles: user.roles.map(r => r.name)
        });

        // Retornar resposta
        return {
            token,
            user: {
            id: user.ID,
            name: user.name,
            email: user.email,
            roles: user.roles 
            }
        };
    }

    async register({ name, email, cpf, password, roleName }: RegisterCredentials): Promise<RegisterResponse> {
        // 1 Verificar se o usuário já existe
        const existingUser = await this.usersRepository.findByEmail(email);
        if (existingUser) {
            throw new HttpError(400, "Usuário já existe no banco de dados!");
        }

        // 2 faz o Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Busca a role (se não vier, usa 'USER' por padrão)
        const roleToAssign = roleName || "USER";
        const role = await this.roleRepository.getRoleByName(roleToAssign);

        if (!role) {
            throw new HttpError(400, `Role '${roleToAssign}' não encontrada no banco de dados.`);
        }

        // 4. Criar novo usuário
        const newUser = await this.usersRepository.save(new UserAccount(
            name, 
            email,
            cpf,
            [role],
            passwordHash
        ));

        // 5. Gera token JWT
        const token = generateToken({
            sub: newUser.ID,
            name: newUser.name,
            email: newUser.email,
            roles: newUser.roles.map(r => r.name)
        });

        // Retornar resposta
        return {
            token,
            user: {
                id: newUser.ID,
                name: newUser.name,
                cpf: newUser.cpf,
                email: newUser.email,
                roles: newUser.roles
            }
        };
    }
}
