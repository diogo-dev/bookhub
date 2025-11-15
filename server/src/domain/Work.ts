import { Author } from "./Author";
import { Book } from "./Book";

class Work {
  public ID: string;
  public title: string;
  public subtitle: string;
  public description: string;
  public authors: Author[];
  public editions: Book[];
  public createdAt: number;

  constructor(ID?: string) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = Date.now();
  }
}

export { Work };
