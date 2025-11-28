"use client"

import { useRouter } from "next/navigation";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import Link from "next/link";
import { ReservedBook } from "../_components/ReservedBook";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../api/endpoints";

export default function LoanNewBookPage() {

    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [reservations, setReservations] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [cpf, setCpf] = useState<string>("");
    const [isbn, setISBN] = useState<string>("");
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

    function handleISBNChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const onlyNumbers = value.replace(/\D/g, "");
        setISBN(onlyNumbers);
    }

    function handleOnClick() {
        // efetuar o empréstimo
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
                        />
                    </div>
                </div>

                {/* Confirmar dados */}
                <div className={styles.confirmContainer}>
                    <p className={styles.confirmParagraph}>Confirmar dados</p>  

                    <div className={styles.confirmData}>
                        <p><span className={styles.spanTitle}>Usuário:</span> <span className={styles.number}>123455</span> <span>Diogo Felipe</span></p>
                        <p><span className={styles.spanTitle}>Exemplar:</span> <span className={styles.number}>123455</span> <span>Diogo Felipe</span></p>
                    </div>
                </div>

                {/* Botão de empréstimo */}
                <div>
                    <button 
                        className={styles.button}
                        onClick={handleOnClick}
                    >
                        Efetuar Empréstimo
                    </button>
                </div>

            </div>
        </EmployeeLayout>
    );
}