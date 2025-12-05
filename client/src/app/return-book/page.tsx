"use client"

import { useEffect, useState } from "react";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import { BookRecordCard } from "../_components/BookRecordCard";
import { ReturnModal } from "../_components/ReturnModal";
import { toast } from "sonner";
import { get } from "../api";
import { useAuth } from "../_context/AuthContext";
import Link from "next/link";

export default function ReturnBookPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [searchedUser, setSearchedUser] = useState<any>(null);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [open, setOpen] = useState<boolean>(false);
    const [loans, setLoans] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [cpf, setCpf] = useState<string>("");
    const [rawCpf, setRawCpf] = useState<string>("");

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };

    function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const onlyNumbers = value.replace(/\D/g, "");
        setRawCpf(onlyNumbers);
        setCpf(formatCPF(value));
    }

    function handleActiveLoans(loans: any[]) {
        // Filtrar apenas empréstimos com status 'ativo' (incluindo os atrasados)
        const activeLoans = loans.filter(l => l.loanStatus === 'ativo');
        setLoans(activeLoans);
    }

    useEffect(() => {
        if(rawCpf.length !== 11) return;

        const delay = setTimeout(() => {
            fetchUserByCPF(rawCpf);
        })

        setSelectedLoan(null);
        return () => clearTimeout(delay);
    }, [rawCpf]);

    async function fetchUserByCPF(cpf: string) {
        try {
            setLoading(true)
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token não encontrado");

            const res = await get(`/loans/users/${cpf}`, token);

            if (!res.ok) {
                const error = await res.json();
                toast.error(error.message || "Erro ao buscar usuário.");
                return;
            }

            const data = await res.json();
            setSearchedUser(data.user);
            handleActiveLoans(data.loans);
            console.log(data)
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Verificar se o usuário é funcionário ou admin
    const isEmployeeOrAdmin = user?.roles?.some(role => 
        role.toUpperCase() === 'EMPLOYEE' || role.toUpperCase() === 'ADMIN'
    ) || false;

    if (authLoading) {
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

    function isOverdue(dueAt: string): boolean {
        return new Date(Number(dueAt)) < new Date();
    }

    function formatDate(dateString: string): string {
        const date = new Date(Number(dateString));
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Devolução de Livros
                    </h1>
                    <p className={styles.subtitle}>
                        Busque um usuário por CPF para realizar a devolução de livros emprestados
                    </p>
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Buscar Usuário por CPF:</label>
                        <input 
                            type="text" 
                            value={cpf}
                            onChange={handleCPFChange}
                            placeholder="000.000.000-00"
                            className={styles.input}
                            maxLength={14}
                        />
                    </div>
                </div>

                {loading && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Carregando...</p>
                    </div>
                )}

                {!loading && searchedUser && (
                    <div className={styles.userInfo}>
                        <div className={styles.userCard}>
                            <div className={styles.userIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                                </svg>
                            </div>
                            <div className={styles.userDetails}>
                                <p className={styles.userName}>
                                    <span className={styles.userLabel}>Usuário:</span> {searchedUser.name}
                                </p>
                                <p className={styles.userId}>ID: {searchedUser.ID.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && loans && loans.length > 0 && (
                    <div className={styles.loansSection}>
                        <h2 className={styles.sectionTitle}>
                            Empréstimos Ativos ({loans.length})
                        </h2>
                        <div className={styles.loanContainer}>
                            {loans.map((l: any) => (
                                <div 
                                    key={l.loanID} 
                                    className={`${styles.loanCard} ${selectedLoan?.loanID === l.loanID ? styles.selected : ''} ${isOverdue(l.dueAt) ? styles.overdue : ''}`}
                                    onClick={() => setSelectedLoan(l)}
                                >
                                    <BookRecordCard
                                        bookName={l.bookTitle}
                                        bookAuthor={l.authors?.[0] || 'Autor desconhecido'}
                                        bookId={l.bookIsbn}
                                        itemId={l.itemID}
                                        start_at={l.startAt}
                                        end_at={l.dueAt}
                                        isSelected={selectedLoan?.loanID === l.loanID}
                                        onSelect={() => setSelectedLoan(l)}
                                    />
                                    {isOverdue(l.dueAt) && (
                                        <div className={styles.overdueBadge}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                                            </svg>
                                            Atrasado
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && loans && loans.length === 0 && searchedUser && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
                            </svg>
                        </div>
                        <p className={styles.emptyText}>Nenhum empréstimo ativo encontrado</p>
                        <p className={styles.emptySubtext}>Este usuário não possui empréstimos ativos para devolução</p>
                    </div>
                )}

                {!loading && loans && loans.length > 0 && (
                    <div className={styles.actionSection}>
                        <button 
                            className={styles.button}
                            onClick={() => setOpen(true)}
                            disabled={!selectedLoan}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                            </svg>
                            Efetuar Devolução
                        </button>
                        {!selectedLoan && (
                            <p className={styles.hint}>Selecione um empréstimo acima para continuar</p>
                        )}
                    </div>
                )}

                {open && searchedUser && selectedLoan && (
                    <ReturnModal
                        selectedLoan={selectedLoan}
                        onClose={() => {
                            fetchUserByCPF(rawCpf);
                            setOpen(false);
                        }}
                    />
                )}

            </div>
        </EmployeeLayout>
    );
}