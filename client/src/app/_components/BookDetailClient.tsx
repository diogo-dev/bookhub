"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ReserveModal } from "@/app/_components/ReserveModal";
import { BookCover } from "@/app/_components/BookCover";
import { Expand } from "@/app/_components/Expand";
import { useAuth } from "../_context/AuthContext";
import { get, post, del } from "@/app/api";
import { toast } from "sonner";
import { MdArrowBack } from "react-icons/md";

import styles from "./BookDetailClient.module.css";

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

interface Item {
  ID: string;
  status: string;
  isbn: string;
  createdAt: number;
}

interface BookDetailsClientProps {
  isbn: string;
  book: Book;
  items: Item[];
}

export function BookDetailsClient({ isbn, book, items }: BookDetailsClientProps) {
  const [open, setOpen] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(true);
  const { isAuthenticated } = useAuth();

  const availableItem = items.find(item => item.status === "disponivel");
  const availableCount = items.filter(item => item.status === "disponivel").length;

  useEffect(() => {
    async function checkWishlist() {
      if (!isAuthenticated) {
        setCheckingWishlist(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await get('/me/interests', token);
        
        if (response.ok) {
          const interests = await response.json();
          const hasBook = interests.some((interest: any) => interest.bookISBN === isbn);
          setIsInWishlist(hasBook);
        }
      } catch (error) {
        console.error('Erro ao verificar wishlist:', error);
      } finally {
        setCheckingWishlist(false);
      }
    }
    
    checkWishlist();
  }, [isbn, isAuthenticated]);

  async function handleWishlistToggle() {
    if (!isAuthenticated) {
      toast.error("Faça login para adicionar à wishlist");
      return;
    }

    setWishlistLoading(true);
    const token = localStorage.getItem('token');

    try {
      if (isInWishlist) {
        const response = await del(`/me/interests/${isbn}`, token);
        
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || 'Erro ao remover da wishlist.');
          return;
        }
        
        setIsInWishlist(false);
        toast.success("Livro removido da wishlist");
      } else {
        const response = await post('/me/interests', { bookISBN: isbn }, token);
        
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || 'Erro ao adicionar à wishlist.');
          return;
        }
        
        setIsInWishlist(true);
        toast.success("Livro adicionado à wishlist");
      }
    } catch (error) {
      console.error('Erro ao atualizar wishlist:', error);
      toast.error('Erro ao atualizar wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  }

  let reserveDisabled = false;
  let reserveLabel = "Reservar";
  if (!isAuthenticated) {
    reserveDisabled = true;
    reserveLabel = "Faça login para reservar";
  } else if (!availableItem) {
    reserveDisabled = true;
    reserveLabel = "Nenhum exemplar disponível";
  }

  let wishlistLabel = "Adicionar à wishlist";
  let wishlistDisabled = false;
  
  if (!isAuthenticated) {
    wishlistLabel = "Faça login para adicionar à wishlist";
    wishlistDisabled = true;
  } else if (isInWishlist) {
    wishlistLabel = "Remover da wishlist";
  }

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        <MdArrowBack size={20} />
      </Link>
      <div className={styles.content}>
        <div>
          <BookCover coverID={book.cover} />
          <button 
            className={styles.btnPrimary}
            onClick={() => {
              if (!reserveDisabled) setOpen(true);
            }}
            disabled={reserveDisabled}
          > 
            {reserveLabel}
          </button>
          <button 
            className={styles.btnSecondary}
            onClick={handleWishlistToggle}
            disabled={wishlistDisabled || wishlistLoading || checkingWishlist}
          >
            {checkingWishlist ? "Verificando..." : wishlistLabel}
          </button>
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
                  <b id="edition-label">Edição:</b>
                  <span aria-labelledby="edition-label"> {book.edition}</span>
                </li>
              }

              {book.publisher &&
                <li className={styles.property}>
                  <b id="publisher-label">Editora:</b>
                  <span aria-labelledby="publisher-label"> {book.publisher.displayName}</span>
                </li>
              }
            </ul>
            <ul className={styles.column}>
              {book.language &&
                <li className={styles.property}>
                  <b id="language-label">Idioma:</b>
                  <span aria-labelledby="language-label"> {book.language.name} ({book.language.isoCode})</span>
                </li>
              }


              <li className={styles.property}>
                <b id="pages-label">Número de páginas:</b>
                <span aria-labelledby="pages-label"> {book.numberOfPages}</span>
              </li>

              <li className={styles.property}>
                <b id="available-label">Cópias disponíveis:</b>
                <span aria-labelledby="available-label"> {availableCount}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {open && isAuthenticated && availableItem && (
        <ReserveModal
          itemId={availableItem.ID}
          onClose={() => setOpen(false)}
        />
      )}

    </div>
  );
}
