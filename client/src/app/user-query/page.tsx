"use client"

import { useState, useEffect } from "react";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import { useAuth } from "../_context/AuthContext";
import { get } from "../api";
import { toast } from "sonner";
import Link from "next/link";
import { FiSearch, FiEye, FiX, FiBook, FiCalendar } from "react-icons/fi";
import { BookCover } from "../_components/BookCover";

interface User {
    id: string;
    name: string;
    email: string;
    cpf: string;
    roles: string[];
    createdAt?: number;
}

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


export default function UserQueryPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userLoans, setUserLoans] = useState<LoanBookDTO[]>([]);
    const [userReservations, setUserReservations] = useState<Reservation[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const isEmployeeOrAdmin = user?.roles?.some(role => 
        role.toUpperCase() === 'EMPLOYEE' || role.toUpperCase() === 'ADMIN'
    ) || false;

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };

    useEffect(() => {
        if (isAuthenticated && isEmployeeOrAdmin) {
            fetchUsers();
        }
    }, [isAuthenticated, isEmployeeOrAdmin]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = users.filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    async function fetchUsers() {
        try {
            setLoadingUsers(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await get('/users', token);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar usuários');
            }

            const data = await response.json();
            // Filtrar apenas clientes (usuários que não são ADMIN ou EMPLOYEE)
            const clients = data.filter((user: User) => {
                const userRoles = user.roles.map(r => r.toUpperCase());
                return !userRoles.includes('ADMIN') && !userRoles.includes('EMPLOYEE');
            });
            setUsers(clients);
            setFilteredUsers(clients);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao carregar usuários');
        } finally {
            setLoadingUsers(false);
        }
    }

    async function fetchUserDetails(userId: string) {
        try {
            setLoadingDetails(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const [loansResponse, reservationsResponse] = await Promise.all([
                get(`/users/${userId}/loans`, token),
                get(`/users/${userId}/reservations`, token)
            ]);

            if (loansResponse.ok) {
                const loansData: LoanBookDTO[] = await loansResponse.json();
                // Buscar capas dos livros
                const loansWithCovers = await Promise.all(
                    loansData.map(async (loan) => {
                        try {
                            const bookResponse = await get(`/books/${loan.bookIsbn}`);
                            if (bookResponse.ok) {
                                const book = await bookResponse.json();
                                return { ...loan, bookCover: book.cover };
                            }
                            return loan;
                        } catch {
                            return loan;
                        }
                    })
                );
                setUserLoans(loansWithCovers);
            } else {
                setUserLoans([]);
            }

            if (reservationsResponse.ok) {
                const reservationsData: Reservation[] = await reservationsResponse.json();
                // Buscar capas dos livros
                const reservationsWithCovers = await Promise.all(
                    reservationsData.map(async (reservation) => {
                        try {
                            const bookResponse = await get(`/books/${reservation.bookIsbn}`);
                            if (bookResponse.ok) {
                                const book = await bookResponse.json();
                                return { ...reservation, cover: book.cover };
                            }
                            return reservation;
                        } catch {
                            return reservation;
                        }
                    })
                );
                setUserReservations(reservationsWithCovers);
            } else {
                setUserReservations([]);
            }
        } catch (error: any) {
            toast.error('Erro ao carregar detalhes do usuário');
        } finally {
            setLoadingDetails(false);
        }
    }

    const handleViewDetails = async (user: User) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
        await fetchUserDetails(user.id);
    };


    function formatDate(dateString: string | number | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(typeof dateString === 'string' ? Number(dateString) : dateString);
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
                    <h1 className={styles.title}>Consulta de Clientes</h1>
                </div>

                <div className={styles.searchContainer}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {loadingUsers ? (
                    <div className={styles.loadingContainer}>
                        <p>Carregando usuários...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                ) : (
                    <div className={styles.usersGrid}>
                        {filteredUsers.map((user) => (
                            <div key={user.id} className={styles.userCard}>
                                <div className={styles.userInfo}>
                                    <h3 className={styles.userName}>{user.name}</h3>
                                    <p className={styles.userEmail}>{user.email}</p>
                                    <p className={styles.userCpf}>CPF: {formatCPF(user.cpf)}</p>
                                </div>
                                <div className={styles.userActions}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => handleViewDetails(user)}
                                        title="Ver detalhes"
                                    >
                                        <FiEye /> Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal de Detalhes */}
                {showDetailsModal && selectedUser && (
                    <div className={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Detalhes do Usuário</h2>
                                <button 
                                    className={styles.closeButton}
                                    onClick={() => setShowDetailsModal(false)}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.userDetails}>
                                    <h3>{selectedUser.name}</h3>
                                    <p><strong>Email:</strong> {selectedUser.email}</p>
                                    <p><strong>CPF:</strong> {formatCPF(selectedUser.cpf)}</p>
                                </div>

                                {loadingDetails ? (
                                    <p>Carregando detalhes...</p>
                                ) : (
                                    <>
                                        <div className={styles.detailsSection}>
                                            <h4><FiBook /> Empréstimos ({userLoans.length})</h4>
                                            {userLoans.length === 0 ? (
                                                <p className={styles.emptyMessage}>Nenhum empréstimo encontrado.</p>
                                            ) : (
                                                <div className={styles.itemsList}>
                                                    {userLoans.map((loan) => (
                                                        <div key={loan.loanID} className={styles.itemCard}>
                                                            <BookCover 
                                                                coverID={loan.bookCover}
                                                            />
                                                            <div className={styles.itemInfo}>
                                                                <h5>{loan.bookTitle}</h5>
                                                                <p className={styles.authors}>
                                                                    {loan.authors.join(', ')}
                                                                </p>
                                                                <div className={styles.itemMeta}>
                                                                    <span><strong>Código:</strong> {loan.loanCode}</span>
                                                                    <span className={`${styles.statusBadge} ${getStatusClass(loan.loanStatus)}`}>
                                                                        {getStatusLabel(loan.loanStatus)}
                                                                    </span>
                                                                </div>
                                                                <div className={styles.itemDates}>
                                                                    <span><strong>Início:</strong> {formatDate(loan.startAt)}</span>
                                                                    <span><strong>Vencimento:</strong> {formatDate(loan.dueAt)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.detailsSection}>
                                            <h4><FiCalendar /> Reservas ({userReservations.length})</h4>
                                            {userReservations.length === 0 ? (
                                                <p className={styles.emptyMessage}>Nenhuma reserva encontrada.</p>
                                            ) : (
                                                <div className={styles.itemsList}>
                                                    {userReservations.map((reservation) => (
                                                        <div key={reservation.reservationID} className={styles.itemCard}>
                                                            <BookCover 
                                                                coverID={reservation.cover}
                                                            />
                                                            <div className={styles.itemInfo}>
                                                                <h5>{reservation.bookTitle}</h5>
                                                                <p className={styles.authors}>
                                                                    {reservation.authors.join(', ')}
                                                                </p>
                                                                <div className={styles.itemMeta}>
                                                                    <span><strong>Código:</strong> {reservation.reservationID}</span>
                                                                    <span className={styles.statusBadge}>
                                                                        {reservation.itemStatus}
                                                                    </span>
                                                                </div>
                                                                <div className={styles.itemDates}>
                                                                    <span><strong>Início:</strong> {formatDate(reservation.startAt)}</span>
                                                                    <span><strong>Fim:</strong> {formatDate(reservation.endAt)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}
