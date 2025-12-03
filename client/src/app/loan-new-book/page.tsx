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
                <h1>
                    Novo Empréstimo
                </h1>

                <div className={styles.reservationData}>
                    <div>
                        <div className={styles.label}>
                            <p>CPF do usuário:</p>
                        </div>
                        <input 
                            type="text" 
                            value={cpf}
                            onChange={handleCPFChange}
                            required
                        />
                    </div>
                    

                    <div>
                        <div className={styles.label}>
                            <p>ID do livro:</p>
                        </div>
                        <input 
                            type="text" 
                            value={isbn} 
                            onChange={handleISBNChange}
                            required
                        />
                    </div>
                </div>

                <div>
                    {!changeButton ? (
                        <button 
                            className={styles.button}
                            onClick={handleSearchButtonClick}
                        >
                            Buscar por exemplar
                        </button>
                    ) : (
                        <>
                            {user && selectedItem && (
                                <div className={styles.confirmContainer}>
                                    <p className={styles.confirmParagraph}>Confirmar dados</p>  

                                    <div className={styles.confirmData}>
                                        <p>
                                            <span className={styles.spanTitle}>Usuário:</span>
                                            <span className={styles.number}>{user.ID.slice(0, 6)}</span>
                                            <span>{user.name}</span>
                                        </p>

                                        <p>
                                            <span className={styles.spanTitle}>Exemplar:</span>
                                            <span className={styles.number}>{selectedItem.ID.slice(0, 6)}</span>
                                            <span>{book?.title}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button 
                                className={styles.button}
                                onClick={() => setOpen(true)}
                                disabled={!user || !selectedItem}
                            >
                                Efetuar Empréstimo
                            </button>
                        </>
                    )}
                </div>

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