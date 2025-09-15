class DeweyCategory {
  public ID: string;
  public parentID: string | null;
  public decimal: number;
  public name: string;
  public description: string;
  public createdAt: number;

  constructor(ID?: string, createdAt?: number) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = createdAt || Date.now();
  }
}

export { DeweyCategory };
