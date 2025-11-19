import { notFound } from "next/navigation";
import { findBy } from "@/app/fakeBooks";
import { Expand } from "@/app/_components/Expand";

import styles from "./page.module.css";

export default async function BookDetails(props: {
  params: Promise<{ isbn: string }>;
}) {
  const { isbn } = await props.params;
  const book = findBy(isbn);
  if (!book) notFound();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div>
          <div className={styles.cover}>Capa</div>
          <button className={styles.btnPrimary}>Reserve</button>
          <button>Add to wishlist</button>
        </div>
        <div>
          <Expand className={styles.subject} maxHeight={280}>
            <h1>{book.title} {book.subtitle ? `— ${book.subtitle}` : ""}</h1>
            <span>de {book.author}</span>

            <p>{book.description}</p>
          </Expand>

          <div className={styles.spacing}></div>

          <div className={styles.metadata}>
            <ul className={styles.column}>
              <li className={styles.property}>
                <b id="isbn-label">ISBN:</b>
                <span aria-labelledby="isbn-label"> {isbn}</span>
              </li>

              <li className={styles.property}>
                <b id="edition-label">Edição:</b>
                <span aria-labelledby="edition-label"> {book.edition}</span>
              </li>

              <li className={styles.property}>
                <b id="publisher-label">Editora:</b>
                <span aria-labelledby="publisher-label"> {book.publisher}</span>
              </li>
            </ul>
            <ul className={styles.column}>
              <li className={styles.property}>
                <b id="language-label">Idioma:</b>
                <span aria-labelledby="language-label"> {book.language}</span>
              </li>

              <li className={styles.property}>
                <b id="pages-label">Número de páginas:</b>
                <span aria-labelledby="pages-label"> {book.numberOfPages}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
