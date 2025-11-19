import Link from "next/link";
import { IoSearch } from "react-icons/io5";
import { Carrousel } from "./_components/Carrousel";
import { get } from "./api";

import styles from "./page.module.css";
import { BookCover } from "./_components/BookCover";

interface Book {
  ISBN: string;
  title: string;
  subtitle: string;
  authors?: string[];
  cover?: string;
}

export default async function Home() {  
  const response = await get("/books");
  
  if (response.status == 200)
    var topBooksPerGenre: Record<string, Book[]> = await response.json();
  else return <h1 className={styles.error}>{response.status} {response.statusText}</h1>;

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <IoSearch color="black" size={20} />
        <input name="book" type="text" placeholder="Search for books..." />
      </div>

      {Object.entries(topBooksPerGenre).map(([genre, topBooks]) => (
        <section key={genre}>
          <h1>{capitalize(genre)}</h1>
            <Carrousel>
              <ul>
                {topBooks.map((book) => (
                  <li key={book.ISBN}>
                    <Link href={`/books/${book.ISBN}`}>
                      <BookCover coverID={book.cover} />
                      <span>
                        <b>{book.title}</b>
                        {Array.isArray(book.authors) || book.subtitle ? " — " : ""}
                        {Array.isArray(book.authors)
                          ? book.authors?.join(", ")
                          : book.subtitle
                        }</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Carrousel>
        </section>
      ))}
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
