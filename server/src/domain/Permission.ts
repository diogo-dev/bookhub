class Permission {
    public ID: string;
    public name: string;
    public createdAt: number;

    constructor(name: string, ID?: string, createdAt?: number) {
        this.name = name;
        this.ID = ID || crypto.randomUUID();
        this.createdAt = createdAt || Date.now();
    }
}

export { Permission }