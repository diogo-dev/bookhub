class BookItem {
  constructor(
    public readonly ISBN: string,
    public readonly ID: string = crypto.randomUUID(),
    public readonly createdAt: number = Date.now(),
    public readonly status: "disponivel" | "emprestado" | "indisponivel" | "reservado" = "disponivel"
  ) {}
}

export { BookItem };
