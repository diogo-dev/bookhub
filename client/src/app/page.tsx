import Link from "next/link";
import { IoSearch } from "react-icons/io5";
import { booksPerCategory } from "./fakeBooks";
import { Carrousel } from "./_components/Carrousel";

import styles from "./page.module.css";

export default function Home() {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <IoSearch color="black" size={20} />
        <input type="text" />
      </div>

      {Object.entries(booksPerCategory).map(([category, books]) => (
        <section key={category}>
          <h1>{capitalize(category)}</h1>
            <Carrousel>
              <ul>
                {books.map((book) => (
                  <li key={book.title}>
                    <Link href={`/books/${book.isbn}`}>
                      <div className={styles.cover}></div>
                      <span><b>{book.title}</b> — {book.author}</span>
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
