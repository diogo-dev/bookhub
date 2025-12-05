"use client"

import { useState, useEffect } from "react";
import { ClientLayout } from "@/app/_components/ClientLayout"
import styles from './page.module.css'
import { useAuth } from "../_context/AuthContext";
import { get, del } from "../api";
import { BookCover } from "../_components/BookCover";
import Link from "next/link";
import { toast } from "sonner";
import { FiTrash2 } from "react-icons/fi";

interface InterestItem {
  userID: string;
  bookISBN: string;
  createdAt: number;
}

interface Book {
  ISBN: string;
  title: string;
  subtitle?: string;
  authors?: Array<{ ID: string; name: string }>;
  cover?: string;
}

interface BookWithInterest extends Book {
  interestCreatedAt: number;
}

export default function InterestsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<BookWithInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingISBN, setRemovingISBN] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchInterests();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  async function fetchInterests() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await get('/me/interests', token);

      if (!response.ok) {
        throw new Error('Erro ao buscar lista de interesses');
      }

      const interests: InterestItem[] = await response.json();

      if (interests.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }

      // Buscar dados de cada livro
      const bookPromises = interests.map(async (interest) => {
        try {
          const bookResponse = await get(`/books/${interest.bookISBN}`);
          if (bookResponse.ok) {
            const book: Book = await bookResponse.json();
            return {
              ...book,
              interestCreatedAt: interest.createdAt
            } as BookWithInterest;
          }
          return null;
        } catch (error) {
          console.error(`Erro ao buscar livro ${interest.bookISBN}:`, error);
          return null;
        }
      });

      const booksData = await Promise.all(bookPromises);
      const validBooks = booksData.filter((book): book is BookWithInterest => book !== null);
      
      setBooks(validBooks);
    } catch (error) {
      console.error('Erro ao buscar interesses:', error);
      toast.error('Erro ao carregar lista de interesses');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveInterest(isbn: string) {
    try {
      setRemovingISBN(isbn);
      const token = localStorage.getItem('token');
      const response = await del(`/me/interests/${isbn}`, token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao remover da lista');
        return;
      }

      // Remover o livro da lista local
      setBooks(books.filter(book => book.ISBN !== isbn));
      toast.success('Livro removido da lista de interesses');
    } catch (error) {
      console.error('Erro ao remover interesse:', error);
      toast.error('Erro ao remover livro da lista');
    } finally {
      setRemovingISBN(null);
    }
  }

  if (authLoading || loading) {
    return (
      <ClientLayout>
        <div className={styles.loadingContainer}>
          <p>Carregando...</p>
        </div>
      </ClientLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <ClientLayout>
        <div className={styles.errorContainer}>
          <p>Você precisa estar logado para ver sua lista de interesses</p>
          <Link href="/login" className={styles.loginLink}>Fazer login</Link>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Lista de Interesses</h1>
          <p className={styles.subtitle}>
            {books.length === 0 
              ? "Você ainda não adicionou nenhum livro à sua lista de interesses"
              : `${books.length} ${books.length === 1 ? 'livro' : 'livros'} na sua lista`
            }
          </p>
        </div>

        {books.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <p className={styles.emptyText}>Sua lista de interesses está vazia</p>
            <p className={styles.emptySubtext}>Explore os livros e adicione os que você gostaria de ler!</p>
            <Link href="/" className={styles.exploreButton}>
              Explorar Livros
            </Link>
          </div>
        ) : (
          <div className={styles.booksGrid}>
            {books.map((book) => (
              <div key={book.ISBN} className={styles.bookCard}>
                <Link href={`/books/${book.ISBN}`} className={styles.bookLink}>
                  <div className={styles.coverContainer}>
                    <BookCover coverID={book.cover} />
                  </div>
                  <div className={styles.bookInfo}>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    {book.subtitle && (
                      <p className={styles.bookSubtitle}>{book.subtitle}</p>
                    )}
                    {book.authors && book.authors.length > 0 && (
                      <p className={styles.bookAuthors}>
                        {book.authors.map(a => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveInterest(book.ISBN);
                  }}
                  disabled={removingISBN === book.ISBN}
                  title="Remover da lista"
                >
                  {removingISBN === book.ISBN ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <FiTrash2 size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
