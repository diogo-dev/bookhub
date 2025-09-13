class Author {
  public ID: string;
  public name: string;
  public biography: string;
  // public photo: string;
  public birthDate: Date;
  public deathDate: Date;
  public createdAt: number;

  constructor(ID?: string, createdAt?: number) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = createdAt || Date.now();
  }
}

export { Author };
