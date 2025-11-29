"use client"

import { ClientLayout } from "@/app/_components/ClientLayout"
import styles from './page.module.css'
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { API_ENDPOINTS } from "../api/endpoints";


export default function UserProfile() {

    const formatCPF = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    };

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token")

        if(!token) {
            setLoading(false)
            console.log("Token not found")
            return
        }

        const loadUser = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.profile, {
                    method: "GET", 
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || "Erro na resposta dos dados do perfil");
                }

                const data = await res.json();
                setUser(data);
                console.log(data)
            } catch (error: any) {
                toast.error(error.message || "Erro ao buscar dados do perfil", {duration: 2000});
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    if(loading) {
        return (
            <ClientLayout>
                <p>Loading ...</p>
            </ClientLayout>
        );
    }

    if (!user) {
        return (
            <ClientLayout>
                <p>Usuário não autenticado</p>
                <Link href="/login">Ir para login</Link>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
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

                <hr className={styles.separator} />

                <div>
                    <h1 className={styles.title}>Deletar Conta</h1>

                    <p>Depois de excluir sua conta não há como voltar atrás!</p>
                    <p>Certifique-se antes de deletar!</p>

                    <button className={styles.button}>Deletar conta</button>
                </div>
            </div>
        </ClientLayout>
    );
}