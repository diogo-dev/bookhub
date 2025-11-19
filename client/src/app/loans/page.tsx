"use client"

import { ClientLayout } from "@/app/_components/ClientLayout"
import styles from './page.module.css'

export default function LoansPage() {

    return (
        <ClientLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>
                    Histórico de Empréstimos
                </h1>
            </div>
        </ClientLayout>
    );
}