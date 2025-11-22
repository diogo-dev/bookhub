class InterestItem { 
    public readonly userID: string;
    public readonly bookISBN: string;
    public readonly createdAt?: number;

    constructor(userID: string, bookISBN: string, createdAt: number) {
        this.userID = userID;
        this.bookISBN = bookISBN;
        this.createdAt = createdAt ?? Date.now();
    }
}

export { InterestItem };