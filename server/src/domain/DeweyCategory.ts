class DeweyCategory {
  public ID: string;
  public parentID: string | null;
  public decimal: string;
  public name: string;
  public createdAt: number;

  constructor(ID?: string, createdAt?: number) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = createdAt || Date.now();
    this.parentID = null;
  }
}

export { DeweyCategory };
