import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/app/_components/BookCover";
import { Expand } from "@/app/_components/Expand";
import { get, post } from "@/app/api";

import styles from "./page.module.css";

interface Book {
  workID?: string,
  title: string;
  subtitle: string;
  description: string;
  authors: {
    ID: string;
    name: string;
  }[];
  publisher?: {
    name: string;
    displayName: string;
  } | null;
  categoryTree?: {
    ID: string;
    name: string;
    decimal: string;
    level: number;
  }[];
  cover?: string;
  edition?: string;
  language?: {
    isoCode: string;
    name: string;
  };
  numberOfPages: number;
  numberOfVisits: number;
  createdAt: number;
}

export default async function BookDetails(props: {
  params: Promise<{ isbn: string }>;
}) {
  const { isbn } = await props.params;
  const response = await get(`/books/${isbn}`);

  if (response.status == 404) {
    notFound();
  } else if (response.status != 200) {
    return <h1 className={styles.error}>{response.status} {response.statusText}</h1>;
  }

  post(`/books/${isbn}/visits`);

  const book: Book = await response.json();
  return (
    <div className={styles.container}>
      <Link href="/">Back to homepage</Link>
      <div className={styles.content}>
        <div>
          <BookCover coverID={book.cover} />
          <button className={styles.btnPrimary}>Reserve</button>
          <button>Add to wishlist</button>
        </div>
        <div>
          <Expand className={styles.subject} maxHeight={280}>
            {book.categoryTree && book.categoryTree.length
              ? <div className={styles.categoryTree}>
                  {book.categoryTree
                    .map(category => category.name)
                    .join(" | ")}
                </div>
              : null
            }

            <h1>{book.title} {book.subtitle ? `— ${book.subtitle}` : ""}</h1>
            {book.authors.length &&
              <span>by {book.authors.map(author => author.name).join(", ")}</span>}

            <p>{book.description ? book.description : "[Empty Description]"}</p>
          </Expand>

          <div className={styles.spacing}></div>

          <div className={styles.metadata}>
            <ul className={styles.column}>
              <li className={styles.property}>
                <b id="isbn-label">ISBN:</b>
                <span aria-labelledby="isbn-label"> {isbn}</span>
              </li>

              {book.edition &&
                <li className={styles.property}>
                  <b id="edition-label">Edition:</b>
                  <span aria-labelledby="edition-label"> {book.edition}</span>
                </li>
              }

              {book.publisher &&
                <li className={styles.property}>
                  <b id="publisher-label">Publisher:</b>
                  <span aria-labelledby="publisher-label"> {book.publisher.displayName}</span>
                </li>
              }
            </ul>
            <ul className={styles.column}>
              {book.language &&
                <li className={styles.property}>
                  <b id="language-label">Language:</b>
                  <span aria-labelledby="language-label"> {book.language.name} ({book.language.isoCode})</span>
                </li>
              }


              <li className={styles.property}>
                <b id="pages-label">Number of pages:</b>
                <span aria-labelledby="pages-label"> {book.numberOfPages}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
