"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IoSearch } from "react-icons/io5";
import { get } from "../api";
import { BookCover } from "../_components/BookCover";
import styles from "./page.module.css";

interface Book {
  ISBN: string;
  title: string;
  subtitle?: string;
  authors?: Array<{ ID: string; name: string }>;
  cover?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  async function searchBooks(searchQuery: string) {
    if (!searchQuery.trim()) {
      setBooks([]);
      return;
    }

    try {
      setLoading(true);
      const response = await get(`/books/search?q=${encodeURIComponent(searchQuery.trim())}&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        console.error("Erro na resposta da API:", errorData);
        setBooks([]);
      }
    } catch (error) {
      console.error("Erro ao buscar livros:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (query) {
      searchBooks(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <div className={styles.inputContainer}>
            <IoSearch size={24} />
            <input
              type="text"
              placeholder="Pesquise por livros, autores, gêneros..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>
      </div>

      {query && (
        <div className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>
            {loading ? "Buscando..." : books.length > 0 
              ? `Encontrados ${books.length} livro${books.length !== 1 ? 's' : ''} para "${query}"`
              : `Nenhum livro encontrado para "${query}"`
            }
          </h2>

          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : books.length > 0 ? (
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
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>Tente pesquisar com outros termos ou verifique a ortografia.</p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className={styles.emptyState}>
          <p>Digite algo na busca para encontrar livros</p>
        </div>
      )}
    </div>
  );
}

