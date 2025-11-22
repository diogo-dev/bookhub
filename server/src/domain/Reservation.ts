class Reservation { 

    public readonly ID: string;
    public code: string;
    public readonly userID: string;
    public readonly itemID: string;
    public startAt: number;
    public endAt: number;
    public readonly createdAt?: number;

    constructor(ID: string, code: string, userID: string, itemID: string, startAt: number, endAt: number, createdAt: number) {
        this.ID = ID || crypto.randomUUID();
        this.code = code || this.generateCode();
        this.userID = userID;
        this.itemID = itemID;
        this.startAt = startAt;
        this.endAt = endAt;
        this.createdAt = createdAt || Date.now();
    }

    private generateCode(): string {
        const prefix = 'RES';
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${prefix}-${year}-${random}`;
    }
}

export { Reservation };