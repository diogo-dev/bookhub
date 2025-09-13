class Author {
  public ID: string;
  public name: string;
  public biography: string;
  // public photo: string;
  public birthDate: Date;
  public deathDate: Date;
  public createdAt: number;

  constructor() {
    this.ID = crypto.randomUUID();
    this.createdAt = Date.now();
  }
}

export { Author };
