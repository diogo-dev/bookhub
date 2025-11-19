"use client"


import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'

export default function UserQueryPage() {

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>
                    Consulta de Usuários
                </h1>

            </div>
        </EmployeeLayout>
    );
}