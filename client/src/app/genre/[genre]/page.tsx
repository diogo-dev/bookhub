"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { get } from "../../api";
import { BookCover } from "../../_components/BookCover";
import styles from "./page.module.css";

interface Book {
  ISBN: string;
  title: string;
  subtitle?: string;
  authors?: Array<{ ID: string; name: string }>;
  cover?: string;
  publishedAt?: number;
}

type SortBy = 'popularity' | 'title' | 'date' | 'pages';
type SortOrder = 'asc' | 'desc';

export default function GenrePage() {
  const params = useParams();
  const router = useRouter();
  const genre = params.genre as string;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>('popularity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const limit = 24;

  useEffect(() => {
    if (genre) {
      fetchBooks();
    }
  }, [genre, sortBy, sortOrder, yearFrom, yearTo, page]);

  async function fetchBooks() {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder
      });

      if (yearFrom) params.append('yearFrom', yearFrom);
      if (yearTo) params.append('yearTo', yearTo);

      const response = await get(`/books/genre/${encodeURIComponent(genre)}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("Erro ao buscar livros por gênero:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }


  function formatYear(timestamp?: number): string {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).getFullYear().toString();
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{capitalize(genre)}</h1>
        {total > 0 && (
          <p className={styles.subtitle}>
            {total} livro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label htmlFor="sortBy" className={styles.filterLabel}>Ordenar por</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortBy);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="popularity">Mais Populares</option>
              <option value="title">Título (A-Z)</option>
              <option value="date">Data de Publicação</option>
              <option value="pages">Número de Páginas</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sortOrder" className={styles.filterLabel}>Ordem</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as SortOrder);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="yearFrom" className={styles.filterLabel}>Ano de</label>
            <input
              id="yearFrom"
              type="number"
              placeholder="Ex: 1900"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              onBlur={() => setPage(1)}
              className={styles.filterInput}
              min="1000"
              max="3000"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="yearTo" className={styles.filterLabel}>Ano até</label>
            <input
              id="yearTo"
              type="number"
              placeholder="Ex: 2024"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              onBlur={() => setPage(1)}
              className={styles.filterInput}
              min="1000"
              max="3000"
            />
          </div>

          {(yearFrom || yearTo) && (
            <div className={styles.filterGroup}>
              <button
                onClick={() => {
                  setYearFrom('');
                  setYearTo('');
                  setPage(1);
                }}
                className={styles.clearFiltersButton}
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando livros...</div>
      ) : books.length > 0 ? (
        <>
          <div className={styles.booksGrid}>
            {books.map((book) => (
              <Link key={book.ISBN} href={`/books/${book.ISBN}`} className={styles.bookCard}>
                <BookCover coverID={book.cover} />
                <div className={styles.bookInfo}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  {book.subtitle && (
                    <p className={styles.bookSubtitle}>{book.subtitle}</p>
                  )}
                  {book.authors && book.authors.length > 0 && (
                    <p className={styles.bookAuthors}>
                      {book.authors.map(a => a.name).join(", ")}
                    </p>
                  )}
                  {book.publishedAt && (
                    <p className={styles.bookYear}>
                      {formatYear(book.publishedAt)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={styles.paginationButton}
              >
                Anterior
              </button>
              <span className={styles.paginationInfo}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={styles.paginationButton}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noResults}>
          <p>Nenhum livro encontrado para este gênero com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}

