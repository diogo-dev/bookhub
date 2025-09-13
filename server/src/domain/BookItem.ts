class BookItem {
  constructor(
    public readonly ISBN: string,
    public readonly ID: string = crypto.randomUUID(),
    public readonly createdAt: number = Date.now()
  ) {}
}

export { BookItem };
