import Link from "next/link";
import { Carrousel } from "./_components/Carrousel";
import { get } from "./api";

import styles from "./page.module.css";
import { BookCover } from "./_components/BookCover";
import { SearchBar } from "./_components/SearchBar";

interface Book {
  ISBN: string;
  title: string;
  subtitle: string;
  authors?: string[];
  cover?: string;
}

interface Stats {
  totalBooks: number;
  totalGenres: number;
  totalAuthors: number;
  availableItems: number;
}

export default async function Home() {  
  const [booksResponse, statsResponse] = await Promise.all([
    get("/books"),
    get("/books/stats")
  ]);
  
  if (booksResponse.status != 200) {
    return <h1 className={styles.error}>{booksResponse.status} {booksResponse.statusText}</h1>;
  }

  const topBooksPerGenre: Record<string, Book[]> = await booksResponse.json();
  const stats: Stats = statsResponse.status === 200 ? await statsResponse.json() : {
    totalBooks: 0,
    totalGenres: 0,
    totalAuthors: 0,
    availableItems: 0
  };

  // Separar trends dos outros gêneros
  const trends = topBooksPerGenre.trends || [];
  const genres = Object.entries(topBooksPerGenre).filter(([key]) => key !== 'trends');

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Bem-vindo ao BookHub</h1>
        <p className={styles.heroSubtitle}>Descubra milhares de livros e explore novos mundos</p>
        <SearchBar />
      </div>

      {/* Seção de Estatísticas */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{formatNumber(stats.totalBooks)}</div>
            <div className={styles.statLabel}>Livros</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{formatNumber(stats.totalGenres)}</div>
            <div className={styles.statLabel}>Gêneros</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{formatNumber(stats.totalAuthors)}</div>
            <div className={styles.statLabel}>Autores</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{formatNumber(stats.availableItems)}</div>
            <div className={styles.statLabel}>Cópias Disponíveis</div>
          </div>
        </div>
      </div>

      {/* Seção de Destaques/Trends */}
      {trends.length > 0 && (
        <section className={styles.highlightSection}>
          <div className={styles.sectionHeader}>
            <h1 className={styles.highlightTitle}>🔥 Em Destaque</h1>
            <p className={styles.sectionDescription}>Os livros mais populares do momento</p>
          </div>
          <Carrousel>
            <ul>
              {trends.map((book) => (
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
      )}

      {/* Seções por Gênero */}
      {genres.map(([genre, topBooks]) => (
        <section key={genre} className={styles.genreSection}>
          <div className={styles.sectionHeader}>
            <Link href={`/genre/${genre}`} className={styles.genreLink}>
              <h1>{capitalize(genre)}</h1>
            </Link>
            <Link href={`/genre/${genre}`} className={styles.viewAllLink}>
              Ver todos →
            </Link>
          </div>
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

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
