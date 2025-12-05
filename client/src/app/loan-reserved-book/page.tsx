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
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Empréstimo Reservado
                    </h1>
                    <p className={styles.subtitle}>
                        Busque um usuário por CPF para realizar empréstimos de livros já reservados
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

                {!loading && user && (
                    <div className={styles.userInfo}>
                        <div className={styles.userCard}>
                            <div className={styles.userIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                                </svg>
                            </div>
                            <div className={styles.userDetails}>
                                <p className={styles.userName}>
                                    <span className={styles.userLabel}>Usuário:</span> {user.name}
                                </p>
                                <p className={styles.userId}>ID: {user.ID.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && reservations && reservations.length > 0 && (
                    <div className={styles.reservationsSection}>
                        <h2 className={styles.sectionTitle}>
                            Reservas Ativas ({reservations.length})
                        </h2>
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
                    </div>
                )}

                {!loading && reservations && reservations.length === 0 && user && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
                            </svg>
                        </div>
                        <p className={styles.emptyText}>Nenhuma reserva ativa encontrada</p>
                        <p className={styles.emptySubtext}>Este usuário não possui reservas disponíveis para empréstimo</p>
                    </div>
                )}

                {!loading && reservations && reservations.length > 0 && (
                    <div className={styles.actionSection}>
                        <button 
                            className={styles.button}
                            onClick={() => setOpen(true)}
                            disabled={!selectedReservation}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                            </svg>
                            Efetuar Empréstimo
                        </button>
                        {!selectedReservation && (
                            <p className={styles.hint}>Selecione uma reserva acima para continuar</p>
                        )}
                    </div>
                )}

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