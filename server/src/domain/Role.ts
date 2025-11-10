import { Permission } from "./Permission";

class Role {
    public ID: string;
    public name: string;
    public permissions: Permission[];
    public createdAt: number;

    constructor(name: string, permissions: Permission[], ID?: string, createdAt?: number) {
        this.name = name;
        this.permissions = permissions;
        this.ID = ID || crypto.randomUUID();
        this.createdAt = createdAt || Date.now();
    }
}

export { Role }