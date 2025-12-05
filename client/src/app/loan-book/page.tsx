"use client"

import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import Link from "next/link";
import { useAuth } from "../_context/AuthContext";
import { useState, useEffect } from "react";
import { get } from "../api";
import { toast } from "sonner";
import { BookCover } from "../_components/BookCover";

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

export default function LoanBookPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [historyCpf, setHistoryCpf] = useState<string>("");
    const [rawHistoryCpf, setRawHistoryCpf] = useState<string>("");
    const [loans, setLoans] = useState<LoanBookDTO[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Verificar se o usuário é funcionário ou admin
    const isEmployeeOrAdmin = user?.roles?.some(role => 
        role.toUpperCase() === 'EMPLOYEE' || role.toUpperCase() === 'ADMIN'
    ) || false;

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };

    function handleHistoryCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const onlyNumbers = value.replace(/\D/g, "");
        setRawHistoryCpf(onlyNumbers);
        setHistoryCpf(formatCPF(value));
    }

    async function fetchLoanHistory(cpf: string) {
        if (cpf.length !== 11) return;
        
        try {
            setLoadingHistory(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token não encontrado");

            const res = await get(`/loans/users/${cpf}`, token);

            if (!res.ok) {
                const error = await res.json();
                // Se o erro for 404, pode ser que o usuário não tenha empréstimos
                if (res.status === 404 && error.message?.includes("loans not found")) {
                    setLoans([]);
                    setShowHistory(true);
                    toast.info("Nenhum empréstimo encontrado para este CPF.");
                    return;
                }
                toast.error(error.message || "Erro ao buscar histórico.");
                setLoans([]);
                setShowHistory(false);
                return;
            }

            const data = await res.json();
            const loansData = data.loans || [];
            setLoans(loansData);
            setShowHistory(true);
            
            if (loansData.length === 0) {
                toast.info("Nenhum empréstimo encontrado para este CPF.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar histórico de empréstimos.");
            setLoans([]);
            setShowHistory(false);
        } finally {
            setLoadingHistory(false);
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

    if (loading) {
        return (
            <EmployeeLayout>
                <div className={styles.page}>
                    <p>Carregando...</p>
                </div>
            </EmployeeLayout>
        );
    }

    if (!isAuthenticated || !user || !isEmployeeOrAdmin) {
        return (
            <EmployeeLayout>
                <div className={styles.page}>
                    <p>Acesso negado. Apenas funcionários e administradores podem acessar esta página.</p>
                    <Link href="/login">Ir para login</Link>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Empréstimo de Livros
                    </h1>
                    <p className={styles.subtitle}>
                        Gerencie empréstimos e consulte o histórico de livros emprestados
                    </p>
                </div>

                <div className={styles.optionsContainer}>
                    <Link
                        href="/loan-reserved-book"
                        className={styles.optionCard}
                    >
                        <div className={styles.cardIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM15 16H7V14H15V16ZM17 8H7V6H17V8Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <h3 className={styles.cardTitle}>Empréstimo Reservado</h3>
                        <p className={styles.cardDescription}>
                            Realize empréstimos de livros que já foram reservados pelos usuários
                        </p>
                    </Link>

                    <Link
                        href="/loan-new-book"
                        className={styles.optionCard}
                    >
                        <div className={styles.cardIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <h3 className={styles.cardTitle}>Novo Empréstimo</h3>
                        <p className={styles.cardDescription}>
                            Crie um novo empréstimo para um usuário e livro específicos
                        </p>
                    </Link>
                </div>

                <div className={styles.historySection}>
                    <div className={styles.historyHeader}>
                        <h2 className={styles.historyTitle}>Histórico de Empréstimos</h2>
                        <p className={styles.historySubtitle}>
                            Consulte o histórico de empréstimos de um usuário pelo CPF
                        </p>
                    </div>

                    <div className={styles.searchContainer}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>CPF do Usuário:</label>
                            <input 
                                type="text" 
                                value={historyCpf}
                                onChange={handleHistoryCPFChange}
                                placeholder="000.000.000-00"
                                className={styles.input}
                                maxLength={14}
                            />
                        </div>
                        <button 
                            className={styles.searchButton}
                            onClick={() => fetchLoanHistory(rawHistoryCpf)}
                            disabled={rawHistoryCpf.length !== 11 || loadingHistory}
                        >
                            {loadingHistory ? 'Buscando...' : 'Buscar Histórico'}
                        </button>
                    </div>

                    {showHistory && (
                        <div className={styles.historyResults}>
                            {loans.length === 0 ? (
                                <div className={styles.emptyHistory}>
                                    <div className={styles.emptyIcon}>
                                        <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
                                        </svg>
                                    </div>
                                    <p className={styles.emptyText}>Nenhum empréstimo encontrado</p>
                                    <p className={styles.emptySubtext}>Este usuário não possui empréstimos registrados</p>
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
                    )}
                </div>
            </div>
        </EmployeeLayout>
    );
}