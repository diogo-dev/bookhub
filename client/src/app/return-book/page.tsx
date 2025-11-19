"use client"

import { useState } from "react";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'

export default function ReturnBookPage() {
    const [value, setValue] = useState("")

    function formatCPF(value: string): string {
        const numbers = value.replace(/\D/g, '');
        const cpf = numbers.slice(0, 11);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
                .slice(0, 14); 
    }

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>
                    Devolução de Livros
                </h1>

                <p>Buscar usuário por CPF:</p>

                <input
                    className={styles.input}
                    placeholder="XXX.XXX.XXX-XX"
                    value={value}
                    onChange={(e) => setValue(formatCPF(e.target.value))}
                />

            </div>
        </EmployeeLayout>
    );
}