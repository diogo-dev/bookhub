"use client"

import { ClientLayout } from "@/app/_components/ClientLayout"
import styles from './page.module.css'

export default function InterestsPage() {

    return (
        <ClientLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>
                    Lista de Interesses
                </h1>
            </div>
        </ClientLayout>
    );
}