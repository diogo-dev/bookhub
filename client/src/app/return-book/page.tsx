"use client"

import { useEffect, useState } from "react";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import { BookRecordCard } from "../_components/BookRecordCard";
import { ReturnModal } from "../_components/ReturnModal";
import { toast } from "sonner";
import { get } from "../api";

export default function ReturnBookPage() {
    const [user, setUser] = useState<any>(null);
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
        const activeLoans = loans.filter(l => {
            const now = Date.now();
            const dueAt = l.dueAt;
            return dueAt >= now && l.loanStatus === 'ativo';
        });
        setLoans(activeLoans);
        console.log({activeLoans});
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
            setUser(data.user);
            handleActiveLoans(data.loans);
            console.log(data)
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <h1>
                    Devolução de livros
                </h1>

                <div className={styles.inputCPF}>
                    <p className={styles.label}>Buscar Usuário por CPF:</p>
                    <input 
                        type="text" 
                        value={cpf}
                        onChange={handleCPFChange}
                    />
                </div>

                {loading && (
                    <p>Carregando ...</p>
                )}

                {!loading && user ? (
                    <>
                        <div className={styles.user}>
                            <p><span className={styles.loanLabel}>Empréstimos:</span> {user.name}</p>
                            <p>Id: {(user.ID).slice(0,8)}</p>
                        </div>

                        <hr className={styles.separator} />
                    </>
                ) : (null)}

                {!loading && loans ? (
                    <>
                        <div className={styles.loanContainer}>
                            {loans.map((l: any) => (
                                <BookRecordCard
                                    key={l.loanID}
                                    bookName={l.bookTitle}
                                    bookAuthor={l.authors[0]}
                                    bookId={l.bookIsbn}
                                    itemId={l.itemID}
                                    start_at={l.startAt}
                                    end_at={l.dueAt}

                                    isSelected={selectedLoan?.loanID === l.loanID}
                                    onSelect={() => setSelectedLoan(l)}
                                />
                            ))}
                        </div>

                        <hr className={styles.separator} />

                        <div>
                            <button 
                                className={styles.button}
                                onClick={() => setOpen(true)}
                                disabled={loans.length === 0 || !selectedLoan}
                            >
                                Efetuar Devolução
                            </button>
                        </div>
                    </>
                ) : (null)}

                {open && user && selectedLoan && (
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