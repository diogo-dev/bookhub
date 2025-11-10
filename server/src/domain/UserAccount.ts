import { Role } from "./Role";

class UserAccount {
    public ID: string;
    public name: string;
    public email: string;
    public cpf: string;
    public roles: Role[];
    public password_hash: string;
    public createdAt?: number;

    constructor(name: string, email: string, cpf: string, roles: Role[], password_hash: string, ID?: string, createdAt?: number) {
        this.name = name;
        this.email = email;
        this.cpf = cpf;
        this.roles = roles;
        this.password_hash = password_hash;
        this.ID = ID || crypto.randomUUID();
        this.createdAt = createdAt ?? undefined;
    }

}

export { UserAccount }