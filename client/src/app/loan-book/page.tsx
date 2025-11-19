"use client"

import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import Link from "next/link";

export default function LoanBookPage() {

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>
                    Empréstimo de Livros
                </h1>

                <p className={styles.p}>Escolha uma das opções abaixo:</p>

                <div className={styles.linkContainer}>
                    <Link
                        href="/login"
                        className={styles.link}
                    >
                        Empréstimo Reservado
                    </Link>

                    <Link
                        href="/login"
                        className={styles.link}
                    >
                        Novo Empréstimo
                    </Link>
                </div>
            </div>
        </EmployeeLayout>
    );
}