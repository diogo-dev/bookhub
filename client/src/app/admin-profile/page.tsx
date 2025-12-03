"use client"

import styles from './page.module.css'
import Link from "next/link";
import { useAuth } from "../_context/AuthContext";
import { EmployeeLayout } from '../_components/EmployeeLayout';

export default function AdminProfile() {

    const { user, loading, isAuthenticated } = useAuth();

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };


    if(loading) {
        return (
            <EmployeeLayout>
                <p>Loading ...</p>
            </EmployeeLayout>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <EmployeeLayout>
                <p>Usuário não autenticado</p>
                <Link href="/login">Ir para login</Link>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout>
            <div>
                <h1 className={styles.title}>Meu Perfil</h1>

                <div className={styles.myprofile}>
                    <div>
                        <div className={styles.label}>
                            <p>CPF:</p>
                            <p>Não editável</p>
                        </div>
                        <input type="text" value={formatCPF(user.cpf)} disabled />
                    </div>
                    

                    <div>
                        <div className={styles.label}>
                            <p>Nome Completo:</p>
                            <button className={styles.updateButton}>Alterar</button>
                        </div>
                        <input type="text" value={user.name} readOnly />
                    </div>

                    <div>
                        <div className={styles.label}>
                            <p>Email:</p>
                            <button className={styles.updateButton}>Alterar</button>
                        </div>
                        <input type="text" value={user.email} readOnly />
                    </div>
                </div>

                {/* Mudar o href */}
                <Link href="/login" className={styles.link}>Alterar Senha</Link>

            </div>
        </EmployeeLayout>
    );
}