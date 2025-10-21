class Account {
  public ID: string;
  public email: string;
  public password_hash: string;
  public createdAt: number;

  constructor(ID?: string, createdAt?: number) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = createdAt || Date.now();
  }
}

export { Account };
