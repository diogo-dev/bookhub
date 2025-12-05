"use client"

import { useState, useEffect } from "react";
import { ClientLayout } from "@/app/_components/ClientLayout"
import styles from './page.module.css'
import { useAuth } from "../_context/AuthContext";
import { get } from "../api";
import { BookCover } from "../_components/BookCover";
import Link from "next/link";
import { toast } from "sonner";

interface LoanBookDTO {
  loanID: string;
  loanCode: string;
  startAt: string;
  dueAt: string;
  loanStatus: string;
  itemStatus: string;
  itemID: string;
  bookTitle: string;
  bookIsbn: string;
  bookCover?: string;
  authors: string[];
}

export default function LoansPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loans, setLoans] = useState<LoanBookDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchLoans();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  async function fetchLoans() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await get('/me/loans', token);

      if (!response.ok) {
        throw new Error('Erro ao buscar histórico de empréstimos');
      }

      const loansData: LoanBookDTO[] = await response.json();
      setLoans(loansData);
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error);
      toast.error('Erro ao carregar histórico de empréstimos');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(Number(dateString));
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'ativo': 'Ativo',
      'devolvido': 'Devolvido',
      'atrasado': 'Atrasado'
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status: string): string {
    const statusClassMap: Record<string, string> = {
      'ativo': styles.statusActive,
      'devolvido': styles.statusReturned,
      'atrasado': styles.statusLate
    };
    return statusClassMap[status] || '';
  }

  function isOverdue(dueAt: string, status: string): boolean {
    if (status !== 'ativo') return false;
    return new Date(Number(dueAt)) < new Date();
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
          <p>Você precisa estar logado para ver seu histórico de empréstimos</p>
          <Link href="/login" className={styles.loginLink}>Fazer login</Link>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Histórico de Empréstimos</h1>
          <p className={styles.subtitle}>
            {loans.length === 0 
              ? "Você ainda não possui empréstimos registrados"
              : `${loans.length} ${loans.length === 1 ? 'empréstimo' : 'empréstimos'} no histórico`
            }
          </p>
        </div>

        {loans.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <p className={styles.emptyText}>Nenhum empréstimo encontrado</p>
            <p className={styles.emptySubtext}>Quando você fizer empréstimos, eles aparecerão aqui!</p>
            <Link href="/" className={styles.exploreButton}>
              Explorar Livros
            </Link>
          </div>
        ) : (
          <div className={styles.loansList}>
            {loans.map((loan) => (
              <div key={loan.loanID} className={styles.loanCard}>
                <Link href={`/books/${loan.bookIsbn}`} className={styles.loanLink}>
                  <div className={styles.loanContent}>
                    <div className={styles.coverContainer}>
                      <BookCover coverID={loan.bookCover} />
                    </div>
                    <div className={styles.loanInfo}>
                      <div className={styles.bookHeader}>
                        <h3 className={styles.bookTitle}>{loan.bookTitle}</h3>
                        <span className={`${styles.statusBadge} ${getStatusClass(loan.loanStatus)}`}>
                          {getStatusLabel(loan.loanStatus)}
                        </span>
                      </div>
                      {loan.authors && loan.authors.length > 0 && (
                        <p className={styles.bookAuthors}>
                          {loan.authors.filter(a => a).join(', ')}
                        </p>
                      )}
                      <div className={styles.loanDetails}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Código:</span>
                          <span className={styles.detailValue}>{loan.loanCode}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Emprestado em:</span>
                          <span className={styles.detailValue}>{formatDate(loan.startAt)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Prazo de devolução:</span>
                          <span className={`${styles.detailValue} ${isOverdue(loan.dueAt, loan.loanStatus) ? styles.overdue : ''}`}>
                            {formatDate(loan.dueAt)}
                            {isOverdue(loan.dueAt, loan.loanStatus) && (
                              <span className={styles.overdueBadge}>Atrasado</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
