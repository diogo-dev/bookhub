"use client"

import { useRouter } from "next/navigation";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import Link from "next/link";
import { ReservedBook } from "../_components/ReservedBook";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../api/endpoints";

export default function LoanReservedBookPage() {

    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [reservations, setReservations] = useState<any>(null);
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

    function handleOnClick() {
        // efetuar o empréstimo
    }

    useEffect(() => {
        if(rawCpf.length !== 11) return;

        const delay = setTimeout(() => {
            fetchUserByCPF(rawCpf);
        })

        return () => clearTimeout(delay);
    }, [rawCpf]);

    async function fetchUserByCPF(cpf: string) {
        try {
            setLoading(true)
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token não encontrado");

            const res = await fetch(`${API_ENDPOINTS.reservation}${cpf}`, {
                method : "GET",
                headers: {
                    "Authorization" : `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Erro na resposta da busca por cpf");
            }

            const data = await res.json();
            setUser(data.user);
            setReservations(data.reservations);
            console.log(data)
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
                    Empréstimo Reservado
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

                {/* Verificar se loading é true  ou false */}
                {!loading && user ? (
                    <>
                        <div className={styles.user}>
                            <p>Nome: {user.name}</p>
                            <p>Id: {(user.ID).slice(0,8)}</p>
                        </div>

                        <hr className={styles.separator} />
                    </>
                ) : (null)}


                {/* Iterar pela lista de reservations */}
                {!loading && reservations ? (
                    <>
                        <div className={styles.reservationContainer}>
                            {reservations.map((r: any) => (
                                <ReservedBook
                                    key={r.reservationId}
                                    bookName={r.bookTitle}
                                    bookAuthor={r.authors[0]}
                                    bookId={r.bookIsbn}
                                    itemId={r.itemID}
                                    start_at={r.startAt}
                                    end_at={r.endAt}
                                />
                            ))}
                        </div>

                        <hr className={styles.separator} />

                        <div>
                            <button 
                                className={styles.button}
                                onClick={handleOnClick}
                            >
                                Efetuar Empréstimo
                            </button>
                        </div>
                    </>
                ) : (null)}

                

            </div>
        </EmployeeLayout>
    );
}