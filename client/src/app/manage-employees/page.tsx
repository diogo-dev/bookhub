"use client"

import { useState, useEffect } from "react";
import { EmployeeLayout } from '../_components/EmployeeLayout';
import styles from './page.module.css';
import { useAuth } from "../_context/AuthContext";
import { get, post, patch, del } from "../api";
import { toast } from "sonner";
import Link from "next/link";

interface Employee {
    id: string;
    name: string;
    email: string;
    cpf: string;
    roles: string[];
    createdAt?: number;
}

interface EmployeeFormData {
    name: string;
    email: string;
    cpf: string;
    password: string;
    roleName: string;
}

export default function ManageEmployeesPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState<EmployeeFormData>({
        name: "",
        email: "",
        cpf: "",
        password: "",
        roleName: "EMPLOYEE"
    });
    const [editFormData, setEditFormData] = useState<Partial<EmployeeFormData> & { roleNames?: string[] }>({
        name: "",
        email: "",
        password: "",
        roleNames: []
    });

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            const isAdmin = user.roles?.some(role => role.toUpperCase() === 'ADMIN') || false;
            if (isAdmin) {
                fetchEmployees();
            }
        }
    }, [isAuthenticated, user]);

    async function fetchEmployees() {
        try {
            setLoadingEmployees(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await get('/users', token);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar funcionários');
            }

            const data = await response.json();
            setEmployees(data);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao carregar funcionários');
        } finally {
            setLoadingEmployees(false);
        }
    }

    const handleCreateEmployee = async () => {
        if (!formData.name || !formData.email || !formData.cpf || !formData.password) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await post('/users', {
                name: formData.name,
                email: formData.email,
                cpf: formData.cpf.replace(/\D/g, ''),
                password: formData.password,
                roleName: formData.roleName
            }, token);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar funcionário');
            }

            toast.success("Funcionário criado com sucesso!");
            setShowCreateModal(false);
            setFormData({
                name: "",
                email: "",
                cpf: "",
                password: "",
                roleName: "EMPLOYEE"
            });
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar funcionário');
        }
    };

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee);
        setEditFormData({
            name: employee.name,
            email: employee.email,
            password: "",
            roleNames: employee.roles
        });
        setShowEditModal(true);
    };

    const handleUpdateEmployee = async () => {
        if (!editingEmployee) return;

        if (!editFormData.name || !editFormData.email) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        if (editFormData.password && editFormData.password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const updateData: any = {
                name: editFormData.name,
                email: editFormData.email
            };

            if (editFormData.password) {
                updateData.password = editFormData.password;
            }

            if (editFormData.roleNames) {
                updateData.roleNames = editFormData.roleNames;
            }

            const response = await patch(`/users/${editingEmployee.id}`, updateData, token);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar funcionário');
            }

            toast.success("Funcionário atualizado com sucesso!");
            setShowEditModal(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar funcionário');
        }
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        if (!confirm("Tem certeza que deseja deletar este funcionário?")) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await del(`/users/${employeeId}`, token);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao deletar funcionário');
            }

            toast.success("Funcionário deletado com sucesso!");
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao deletar funcionário');
        }
    };

    const filteredEmployees = employees.filter(employee => {
        const searchLower = searchTerm.toLowerCase();
        return (
            employee.name.toLowerCase().includes(searchLower) ||
            employee.email.toLowerCase().includes(searchLower) ||
            employee.cpf.includes(searchTerm.replace(/\D/g, ''))
        );
    });

    if (loading) {
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

    const isAdmin = user.roles?.some(role => role.toUpperCase() === 'ADMIN') || false;

    if (!isAdmin) {
        return (
            <EmployeeLayout>
                <div className={styles.errorContainer}>
                    <p>Acesso negado. Apenas administradores podem acessar esta página.</p>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Gestão de Funcionários</h1>
                    <p className={styles.subtitle}>Gerencie os funcionários do sistema</p>
                </div>

                <div className={styles.actionsBar}>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className={styles.createButton}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Novo Funcionário
                    </button>
                </div>

                {loadingEmployees ? (
                    <div className={styles.loadingContainer}>
                        <p>Carregando funcionários...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor" opacity="0.3"/>
                            </svg>
                        </div>
                        <p className={styles.emptyText}>
                            {searchTerm ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={styles.createButton}
                            >
                                Criar Primeiro Funcionário
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>CPF</th>
                                    <th>Função</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>{employee.name}</td>
                                        <td>{employee.email}</td>
                                        <td>{formatCPF(employee.cpf)}</td>
                                        <td>
                                            <div className={styles.rolesContainer}>
                                                {employee.roles.map((role, index) => (
                                                    <span key={index} className={styles.roleBadge}>
                                                        {role === 'ADMIN' ? 'Administrador' : role === 'EMPLOYEE' ? 'Funcionário' : role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actionsContainer}>
                                                <button
                                                    onClick={() => handleEditEmployee(employee)}
                                                    className={styles.editButton}
                                                    title="Editar"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M11.333 2.00001C11.5084 1.82475 11.7163 1.68614 11.9444 1.59229C12.1726 1.49845 12.4163 1.45117 12.662 1.45301C12.9077 1.45485 13.1505 1.50578 13.3767 1.60281C13.6029 1.69984 13.8082 1.84106 13.9807 2.01868C14.1532 2.1963 14.2895 2.4067 14.3819 2.63782C14.4743 2.86894 14.5209 3.11628 14.5187 3.36568C14.5165 3.61508 14.4656 3.86135 14.3692 4.09047C14.2728 4.31959 14.1328 4.52701 13.9573 4.70001L13.333 5.33334L10.6667 2.66668L11.333 2.00001ZM9.66667 3.66668L2.66667 10.6667V13.3333H5.33333L12.3333 6.33334L9.66667 3.66668Z" fill="currentColor"/>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(employee.id)}
                                                    className={styles.deleteButton}
                                                    title="Deletar"
                                                    disabled={employee.id === user.id}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M3 4H5H13M7 4V2C7 1.73478 7.10536 1.48043 7.29289 1.29289C7.48043 1.10536 7.73478 1 8 1H10C10.2652 1 10.5196 1.10536 10.7071 1.29289C10.8946 1.48043 11 1.73478 11 2V4M13 4V14C13 14.5304 12.7893 15.0391 12.4142 15.4142C12.0391 15.7893 11.5304 16 11 16H5C4.46957 16 3.96086 15.7893 3.58579 15.4142C3.21071 15.0391 3 14.5304 3 14V4H13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Criar Funcionário */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Novo Funcionário</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className={styles.closeButton}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Nome Completo *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>CPF *</label>
                                <input
                                    type="text"
                                    value={formData.cpf}
                                    onChange={(e) => {
                                        const formatted = formatCPF(e.target.value);
                                        setFormData({ ...formData, cpf: formatted });
                                    }}
                                    className={styles.input}
                                    maxLength={14}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Senha *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Função *</label>
                                <select
                                    value={formData.roleName}
                                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                                    className={styles.input}
                                >
                                    <option value="EMPLOYEE">Funcionário</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateEmployee}
                                className={styles.confirmButton}
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar Funcionário */}
            {showEditModal && editingEmployee && (
                <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Editar Funcionário</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className={styles.closeButton}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Nome Completo *</label>
                                <input
                                    type="text"
                                    value={editFormData.name || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Nova Senha (deixe em branco para não alterar)</label>
                                <input
                                    type="password"
                                    value={editFormData.password || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Função *</label>
                                <select
                                    value={editFormData.roleNames?.[0] || 'EMPLOYEE'}
                                    onChange={(e) => setEditFormData({ ...editFormData, roleNames: [e.target.value] })}
                                    className={styles.input}
                                >
                                    <option value="EMPLOYEE">Funcionário</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateEmployee}
                                className={styles.confirmButton}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </EmployeeLayout>
    );
}

