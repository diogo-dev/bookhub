import { Author } from "./Author";
import { BookItem } from "./BookItem";
import { DeweyCategory } from "./DeweyCategory";
import { Language } from "./Language";
import { Publisher } from "./Publisher";

class Book {
  public ISBN: string;
  public parentISBN: string | null;  // link to first book edition
  public category: DeweyCategory;
  // public cutterCode: string;
  public title: string;
  public subtitle: string;
  public description: string;
  public authors: Author[];
  // public photo: string;
  public publishers: Publisher[];
  public edition: string;
  public language: Language;
  public numberOfPages: number;
  public numberOfVisits: number;
  public publishedAt: number;
  public createdAt: number;
  public items: BookItem[];

  constructor() {
    this.createdAt = Date.now();
  }
}

export { Book };
