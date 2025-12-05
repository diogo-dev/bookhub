"use client"

import { useRouter } from "next/navigation";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import { useEffect, useState } from "react";
import { get } from '../api'
import { toast } from "sonner";
import { LoanModal } from "../_components/LoanModal";

export default function LoanNewBookPage() {

    const [open, setOpen] = useState<boolean>(false);
    const [changeButton, setChangeButton] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const [book, setBook] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [cpf, setCpf] = useState<string>("");
    const [isbn, setISBN] = useState<string>("");
    const [rawCpf, setRawCpf] = useState<string>("");

    useEffect(() => {
        setChangeButton(false);
        setSelectedItem(null);
    }, [isbn, rawCpf]);

    useEffect(() => {
        console.log(selectedItem)
    }, [selectedItem]);

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

    function handleISBNChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const onlyNumbers = value.replace(/\D/g, "");
        setISBN(onlyNumbers);
    }

    function handleSearchButtonClick() {
        if (rawCpf.length !== 11 || isbn.length < 8) {
            toast.error("Dados inválidos.");
            return;
        } 

        fetchLoanInfo(isbn);
    }

    function lookingForAvailableItems(items: any[]) {
        const availableItems = items.filter(i => i.status === 'disponivel');
        if (availableItems.length === 0) {
            toast.error("Nenhum exemplar disponível para este livro.");
        }
        else {
            setSelectedItem(availableItems[0]);
        }
    }

    async function fetchLoanInfo(isbn: string) {
        try {
            setLoading(true)
            const resItems = await get(`/books/${isbn}/items`);
            const resUser = await get(`/users/cpf/${rawCpf}`);
            const resBook = await get(`/books/${isbn}`);

            if (!resUser.ok) {
                const error = await resUser.json();
                toast.error(error.message || "Erro ao buscar dados de novo empréstimo.");
                return;
            }

            const dataItems = await resItems.json();
            lookingForAvailableItems(dataItems);
            const dataUser = await resUser.json();
            setUser(dataUser);
            const dataBook = await resBook.json();
            setBook(dataBook);
            setChangeButton(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false)
        }
    }

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Novo Empréstimo
                    </h1>
                    <p className={styles.subtitle}>
                        Crie um novo empréstimo informando o CPF do usuário e o ISBN do livro
                    </p>
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.inputsGrid}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>CPF do Usuário:</label>
                            <input 
                                type="text" 
                                value={cpf}
                                onChange={handleCPFChange}
                                placeholder="000.000.000-00"
                                className={styles.input}
                                maxLength={14}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>ISBN do Livro:</label>
                            <input 
                                type="text" 
                                value={isbn} 
                                onChange={handleISBNChange}
                                placeholder="Digite o ISBN"
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    {!changeButton ? (
                        <button 
                            className={styles.searchButton}
                            onClick={handleSearchButtonClick}
                            disabled={rawCpf.length !== 11 || isbn.length < 8 || loading}
                        >
                            {loading ? (
                                <>
                                    <div className={styles.spinnerSmall}></div>
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
                                    </svg>
                                    Buscar Exemplar
                                </>
                            )}
                        </button>
                    ) : null}
                </div>

                {loading && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Carregando informações...</p>
                    </div>
                )}

                {!loading && changeButton && user && selectedItem && book && (
                    <div className={styles.confirmSection}>
                        <div className={styles.confirmCard}>
                            <div className={styles.confirmHeader}>
                                <div className={styles.confirmIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                                    </svg>
                                </div>
                                <h2 className={styles.confirmTitle}>Confirmar Dados do Empréstimo</h2>
                            </div>

                            <div className={styles.confirmData}>
                                <div className={styles.dataRow}>
                                    <div className={styles.dataItem}>
                                        <span className={styles.dataLabel}>Usuário:</span>
                                        <div className={styles.dataValue}>
                                            <span className={styles.dataId}>{user.ID.slice(0, 8)}</span>
                                            <span className={styles.dataName}>{user.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.divider}></div>

                                <div className={styles.dataRow}>
                                    <div className={styles.dataItem}>
                                        <span className={styles.dataLabel}>Exemplar:</span>
                                        <div className={styles.dataValue}>
                                            <span className={styles.dataId}>{selectedItem.ID.slice(0, 8)}</span>
                                            <span className={styles.dataName}>{book.title}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            className={styles.button}
                            onClick={() => setOpen(true)}
                            disabled={!user || !selectedItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                            </svg>
                            Efetuar Empréstimo
                        </button>
                    </div>
                )}

                {open && user && selectedItem && (
                    <LoanModal 
                        itemId={selectedItem.ID}
                        userId={user.ID}
                        onClose={() => setOpen(false)}
                    />
                )}

            </div>
        </EmployeeLayout>
    );
}