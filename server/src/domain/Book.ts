import { Author } from "./Author";
import { BookItem } from "./BookItem";
import { DeweyCategory } from "./DeweyCategory";
import { Language } from "./Language";
import { Publisher } from "./Publisher";

class Book {
  public ISBN: string;
  public parentISBN: string;  // link to first book edition
  public category: DeweyCategory;
  // public cutterCode: string;
  public title: string;
  public subtitle: string;
  public description: string;
  public author: Author[];
  // public photo: string;
  public publisher: Publisher[];
  public edition: string;
  public language: Language;
  public numberOfPages: number;
  public numberOfVisits: number;
  public publishedAt: number;
  public createdAt: number;
  public items: BookItem[];
}

export { Book };
