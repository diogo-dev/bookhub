"use client"

import { ClientLayout } from "@/app/_components/ClientLayout"
import styles from './page.module.css'
import { useEffect, useState } from "react";
import Link from "next/link";


export default function Profile() {

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // carregar usuário com useEffect no endpoint auth/me
    // sendo esse endpoint protegido com a verificação com authenticateJWT
    // o token está em localStorage e deve ser passado com pelo
    // headers: { Authorization: `Bearer {localStorage.getItem("token")}` }

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
                        <input type="text" value="13045815944" disabled />
                    </div>
                    

                    <div>
                        <div className={styles.label}>
                            <p>Nome Completo:</p>
                            <button className={styles.updateButton}>Alterar</button>
                        </div>
                        <input type="text" value="Diogo Felipe Soares da Silva" readOnly />
                    </div>

                    <div>
                        <div className={styles.label}>
                            <p>Email:</p>
                            <button className={styles.updateButton}>Alterar</button>
                        </div>
                        <input type="text" value="diogofelipe@gmail.com" readOnly />
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