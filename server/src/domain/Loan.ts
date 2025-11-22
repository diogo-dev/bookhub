class Loan { 
    public readonly ID: string;
    public code: string;
    public readonly reservationID: string | null;
    public readonly userID: string;
    public readonly itemID: string;
    public startAt: number;
    public dueAt: number;
    public returnedAt: number | null;
    public status: "ativo" | "devolvido" | "atrasado";
    public readonly createdAt?: number;

    constructor(
        userID: string,
        itemID: string,
        startAt: number,
        dueAt: number,
        reservationID?: string | null,
        code?: string,
        ID?: string,
        returnedAt?: number | null,
        status?: "ativo" | "devolvido" | "atrasado",
        createdAt?: number
      ) {
        this.ID = ID || crypto.randomUUID();
        this.code = code || this.generateCode();
        this.reservationID = reservationID || null;
        this.userID = userID;
        this.itemID = itemID;
        this.startAt = startAt;
        this.dueAt = dueAt;
        this.returnedAt = returnedAt || null;
        this.status = status || "ativo";
        this.createdAt = createdAt || Date.now();
      }

      private generateCode(): string {

        const prefix = 'LOAN';
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${prefix}-${year}-${random}`;
      }

      public markAsReturned(): void {
        this.returnedAt = Date.now();
        this.status = "devolvido";
      }

      public markAsLate(): void {
        if (this.status === 'ativo' && Date.now() > this.dueAt) {        
            this.status = "atrasado";
        }
      }
}

export { Loan };