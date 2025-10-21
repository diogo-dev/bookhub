class Rating {
  public ID: string;
  public accountID: string | null;
  public workID: string;
  public bookISBN: string | null;
  public score: number;
  public createdAt: number;

  constructor(ID?: string, createdAt?: number) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = createdAt || Date.now();
  }
}

export { Rating };
