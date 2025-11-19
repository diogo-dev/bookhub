"use client"


import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import Link from "next/link";

export default function ManageBookPage() {

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>
                    Gestão de Livros
                </h1>

                <p className={styles.p}>Escolha uma das opções abaixo:</p>

                {/* Mudar os hrefs */}
                <div className={styles.linkContainer}>
                    <Link
                        href="/login"
                        className={styles.link}
                    >
                        Cadastro de Livros
                    </Link>

                    <Link
                        href="/login"
                        className={styles.link}
                    >
                        Alteração de Livros
                    </Link>

                    <Link
                        href="/login"
                        className={styles.link}
                    >
                        Deleção de Livros
                    </Link>
                </div>
            </div>
        </EmployeeLayout>
    );
}