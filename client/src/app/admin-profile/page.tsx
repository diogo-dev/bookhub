"use client"

import { useState, useEffect } from "react";
import { EmployeeLayout } from '../_components/EmployeeLayout';
import styles from './page.module.css'
import Link from "next/link";
import { useAuth } from "../_context/AuthContext";
import { ChangePasswordModal } from "@/app/_components/ChangePasswordModal";
import { EditNameModal } from "@/app/_components/EditNameModal";
import { EditEmailModal } from "@/app/_components/EditEmailModal";
import { DeleteAccountModal } from "@/app/_components/DeleteAccountModal";
import { get } from "../api";
import { BookCover } from "../_components/BookCover";

interface Reservation {
    reservationID: string;
    startAt: string;
    endAt: string;
    itemStatus: string;
    itemID: string;
    bookTitle: string;
    bookIsbn: string;
    authors: string[];
    cover?: string;
}

export default function AdminProfile() {
    const { user, loading, isAuthenticated, refreshUser } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'reservations'>('profile');
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loadingReservations, setLoadingReservations] = useState(false);

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };

    useEffect(() => {
        if (activeTab === 'reservations' && isAuthenticated) {
            fetchReservations();
        }
    }, [activeTab, isAuthenticated]);

    async function fetchReservations() {
        try {
            setLoadingReservations(true);
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            const response = await get('/me/reservations', token);
            
            if (!response.ok) {
                let errorMessage = 'Erro ao buscar reservas';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erro ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Resposta da API não é JSON válido');
            }

            let data: Reservation[];
            try {
                data = await response.json();
            } catch (parseError) {
                throw new Error('Erro ao parsear resposta JSON');
            }
            
            if (!data || !Array.isArray(data)) {
                setReservations([]);
                return;
            }
            
            if (data.length === 0) {
                setReservations([]);
                return;
            }
            
            // Buscar informações completas de cada livro, incluindo a capa
            const reservationsWithCovers = await Promise.all(
                data.map(async (reservation) => {
                    try {
                        const bookResponse = await get(`/books/${reservation.bookIsbn}`);
                        if (bookResponse.ok) {
                            const book = await bookResponse.json();
                            return {
                                ...reservation,
                                cover: book.cover
                            };
                        }
                        return reservation;
                    } catch (error) {
                        return reservation;
                    }
                })
            );
            
            setReservations(reservationsWithCovers);
        } catch (error: any) {
            setReservations([]);
        } finally {
            setLoadingReservations(false);
        }
    }

    function formatDate(timestamp: string | number): string {
        const date = new Date(Number(timestamp));
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function isReservationActive(reservation: Reservation): boolean {
        const now = Date.now();
        const endAt = Number(reservation.endAt);
        return endAt >= now && reservation.itemStatus === 'reservado';
    }

    if(loading) {
        return (
            <EmployeeLayout>
                <div className={styles.loadingContainer}>
                    <p>Carregando...</p>
                </div>
            </EmployeeLayout>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <EmployeeLayout>
                <div className={styles.errorContainer}>
                    <p>Usuário não autenticado</p>
                    <Link href="/login" className={styles.loginLink}>Ir para login</Link>
                </div>
            </EmployeeLayout>
        );
    }

    // Verificar se o usuário é funcionário ou admin
    const isEmployeeOrAdmin = user.roles?.some(role => 
        role.toUpperCase() === 'EMPLOYEE' || role.toUpperCase() === 'ADMIN'
    ) || false;

    if (!isEmployeeOrAdmin) {
        return (
            <EmployeeLayout>
                <div className={styles.errorContainer}>
                    <p>Acesso negado. Apenas funcionários e administradores podem acessar esta página.</p>
                    <Link href="/" className={styles.loginLink}>Voltar para página inicial</Link>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Meu Perfil</h1>
                    <p className={styles.subtitle}>Gerencie suas informações pessoais e configurações da conta</p>
                </div>

                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Informações Pessoais
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'reservations' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('reservations')}
                    >
                        Livros Reservados
                        {reservations.length > 0 && (
                            <span className={styles.badgeCount}>{reservations.filter(isReservationActive).length}</span>
                        )}
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <>
                <div className={styles.profileCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Informações Pessoais</h2>
                    </div>
                    
                    <div className={styles.fieldsContainer}>
                        <div className={styles.fieldGroup}>
                            <div className={styles.fieldLabel}>
                                <label>CPF</label>
                                <span className={styles.badge}>Não editável</span>
                            </div>
                            <input 
                                type="text" 
                                value={formatCPF(user.cpf)} 
                                disabled 
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <div className={styles.fieldLabel}>
                                <label>Nome Completo</label>
                                <button 
                                    className={styles.editButton}
                                    onClick={() => setShowNameModal(true)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.333 2.00001C11.5084 1.82475 11.7163 1.68614 11.9444 1.59229C12.1726 1.49845 12.4163 1.45117 12.662 1.45301C12.9077 1.45485 13.1505 1.50578 13.3767 1.60281C13.6029 1.69984 13.8082 1.84106 13.9807 2.01868C14.1532 2.1963 14.2895 2.4067 14.3819 2.63782C14.4743 2.86894 14.5209 3.11628 14.5187 3.36568C14.5165 3.61508 14.4656 3.86135 14.3692 4.09047C14.2728 4.31959 14.1328 4.52701 13.9573 4.70001L13.333 5.33334L10.6667 2.66668L11.333 2.00001ZM9.66667 3.66668L2.66667 10.6667V13.3333H5.33333L12.3333 6.33334L9.66667 3.66668Z" fill="currentColor"/>
                                    </svg>
                                    Alterar
                                </button>
                            </div>
                            <input 
                                type="text" 
                                value={user.name} 
                                readOnly 
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <div className={styles.fieldLabel}>
                                <label>Email</label>
                                <button 
                                    className={styles.editButton}
                                    onClick={() => setShowEmailModal(true)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.333 2.00001C11.5084 1.82475 11.7163 1.68614 11.9444 1.59229C12.1726 1.49845 12.4163 1.45117 12.662 1.45301C12.9077 1.45485 13.1505 1.50578 13.3767 1.60281C13.6029 1.69984 13.8082 1.84106 13.9807 2.01868C14.1532 2.1963 14.2895 2.4067 14.3819 2.63782C14.4743 2.86894 14.5209 3.11628 14.5187 3.36568C14.5165 3.61508 14.4656 3.86135 14.3692 4.09047C14.2728 4.31959 14.1328 4.52701 13.9573 4.70001L13.333 5.33334L10.6667 2.66668L11.333 2.00001ZM9.66667 3.66668L2.66667 10.6667V13.3333H5.33333L12.3333 6.33334L9.66667 3.66668Z" fill="currentColor"/>
                                    </svg>
                                    Alterar
                                </button>
                            </div>
                            <input 
                                type="email" 
                                value={user.email} 
                                readOnly 
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.cardsGrid}>
                    <div className={styles.actionsCard}>
                        <div className={styles.actionItem}>
                            <div className={styles.actionContent}>
                                <div className={styles.actionIcon}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9Z" stroke="currentColor" strokeWidth="1.5"/>
                                        <path d="M12 1V3M12 17V19M19 12H17M3 12H1M16.364 5.63604L14.9497 7.05025M5.05025 12.9497L3.63604 14.364M16.364 18.364L14.9497 16.9497M5.05025 7.05025L3.63604 5.63604" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div className={styles.actionText}>
                                    <h3 className={styles.actionTitle}>Alterar Senha</h3>
                                    <p className={styles.actionDescription}>Atualize sua senha para manter sua conta segura</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowPasswordModal(true)}
                                className={styles.actionButton}
                            >
                                Alterar
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className={styles.dangerCard}>
                    <div className={styles.dangerHeader}>
                        <div className={styles.dangerIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className={styles.dangerTitle}>Zona de Perigo</h2>
                    </div>
                    <div className={styles.dangerContent}>
                        <p className={styles.dangerText}>
                            Depois de excluir sua conta não há como voltar atrás!
                        </p>
                        <p className={styles.dangerText}>
                            Certifique-se antes de deletar!
                        </p>
                        <button 
                            className={styles.deleteButton}
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 5H5H17M7 5V3C7 2.46957 7.21071 1.96086 7.58579 1.58579C7.96086 1.21071 8.46957 1 9 1H11C11.5304 1 12.0391 1.21071 12.4142 1.58579C12.7893 1.96086 13 2.46957 13 3V5M15 5V17C15 17.5304 14.7893 18.0391 14.4142 18.4142C14.0391 18.7893 13.5304 19 13 19H7C6.46957 19 5.96086 18.7893 5.58579 18.4142C5.21071 18.0391 5 17.5304 5 17V5H15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Deletar conta
                        </button>
                    </div>
                </div>
                </div>
                </>
                )}

                {activeTab === 'reservations' && (
                    <div className={styles.reservationsContainer}>
                        {loadingReservations ? (
                            <div className={styles.loadingContainer}>
                                <p>Carregando reservas...</p>
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
                                    </svg>
                                </div>
                                <p className={styles.emptyText}>Você não possui reservas</p>
                                <p className={styles.emptySubtext}>Explore os livros e faça sua primeira reserva!</p>
                                <Link href="/" className={styles.exploreButton}>
                                    Explorar Livros
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.reservationsList}>
                                {reservations.map((reservation) => {
                                    const isActive = isReservationActive(reservation);
                                    return (
                                        <Link 
                                            key={reservation.reservationID} 
                                            href={`/books/${reservation.bookIsbn}`}
                                            className={styles.reservationCard}
                                        >
                                            <div className={styles.reservationCover}>
                                                <BookCover coverID={reservation.cover} />
                                            </div>
                                            <div className={styles.reservationInfo}>
                                                <h3 className={styles.reservationTitle}>{reservation.bookTitle}</h3>
                                                {reservation.authors && reservation.authors.length > 0 && (
                                                    <p className={styles.reservationAuthors}>
                                                        {reservation.authors.filter(a => a).join(', ')}
                                                    </p>
                                                )}
                                                <div className={styles.reservationDates}>
                                                    <div className={styles.dateGroup}>
                                                        <span className={styles.dateLabel}>Reservado em:</span>
                                                        <span className={styles.dateValue}>{formatDate(reservation.startAt)}</span>
                                                    </div>
                                                    <div className={styles.dateGroup}>
                                                        <span className={styles.dateLabel}>Válido até:</span>
                                                        <span className={styles.dateValue}>{formatDate(reservation.endAt)}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.reservationStatus}>
                                                    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                                                        {isActive ? 'Ativa' : 'Expirada'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
            {showNameModal && user && (
                <EditNameModal 
                    currentName={user.name} 
                    onClose={() => setShowNameModal(false)}
                    onSuccess={refreshUser}
                />
            )}
            {showEmailModal && user && (
                <EditEmailModal 
                    currentEmail={user.email} 
                    onClose={() => setShowEmailModal(false)}
                    onSuccess={refreshUser}
                />
            )}
            {showDeleteModal && (
                <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
            )}
        </EmployeeLayout>
    );
}