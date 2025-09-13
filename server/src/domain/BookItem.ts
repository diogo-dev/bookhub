class BookItem {
  public readonly ID: string;
  public readonly ISBN: string;
  public readonly createdAt: number;

  constructor(
    ISBN: string
  ) {
    this.ISBN = ISBN;
    this.ID = crypto.randomUUID();
    this.createdAt = Date.now();
  }
}

export { BookItem };
