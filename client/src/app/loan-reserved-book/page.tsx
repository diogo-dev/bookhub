"use client"

import { useRouter } from "next/navigation";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import { BookRecordCard } from "../_components/BookRecordCard";
import { useEffect, useState } from "react";
import { LoanModal } from "../_components/LoanModal";
import { toast } from "sonner";
import { get } from "../api";

export default function LoanReservedBookPage() {

    const [selectedReservation, setSelectedReservation] = useState<any>(null);
    const [open, setOpen] = useState<boolean>(false);
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

    function handleActiveReservations(reservations: any[]) {
        const activeReservations = reservations.filter(r => {
            const now = Date.now();
            const endAt = r.endAt;
            return endAt >= now && r.itemStatus === 'reservado';
        });
        setReservations(activeReservations);
    }

    useEffect(() => {
        if(rawCpf.length !== 11) return;

        const delay = setTimeout(() => {
            fetchUserByCPF(rawCpf);
        })

        setSelectedReservation(null);
        return () => clearTimeout(delay);
    }, [rawCpf]);

    async function fetchUserByCPF(cpf: string) {
        try {
            setLoading(true)
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token não encontrado");

            const res = await get(`/reservations/users/${cpf}`, token);

            if (!res.ok) {
                const error = await res.json();
                toast.error(error.message || "Erro ao buscar usuário.");
                return;
            }

            const data = await res.json();
            setUser(data.user);
            handleActiveReservations(data.reservations);
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

                {!loading && user ? (
                    <>
                        <div className={styles.user}>
                            <p><span className={styles.reserveLabel}>Reservas:</span> {user.name}</p>
                            <p>Id: {(user.ID).slice(0,8)}</p>
                        </div>

                        <hr className={styles.separator} />
                    </>
                ) : (null)}

                {!loading && reservations ? (
                    <>
                        <div className={styles.reservationContainer}>
                            {reservations.map((r: any) => (
                                <BookRecordCard
                                    key={r.reservationID}
                                    bookName={r.bookTitle}
                                    bookAuthor={r.authors[0]}
                                    bookId={r.bookIsbn}
                                    itemId={r.itemID}
                                    start_at={r.startAt}
                                    end_at={r.endAt}

                                    isSelected={selectedReservation?.reservationID === r.reservationID}
                                    onSelect={() => setSelectedReservation(r)}
                                />
                            ))}
                        </div>

                        <hr className={styles.separator} />

                        <div>
                            <button 
                                className={styles.button}
                                onClick={() => setOpen(true)}
                                disabled={reservations.length === 0 || !selectedReservation}
                            >
                                Efetuar Empréstimo
                            </button>
                        </div>
                    </>
                ) : (null)}

                {open && user && selectedReservation && (
                    <LoanModal 
                        itemId={selectedReservation.itemID}
                        userId={user.ID}
                        reservationId={selectedReservation.reservationID}
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