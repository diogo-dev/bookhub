"use client"

import { useState } from "react";
import styles from "./ReservedBook.module.css"

interface ReservedBookProps {
    bookName:string;
    bookAuthor:string;
    bookId: string;
    start_at: string;
    end_at: string;
}

export function ReservedBook({
    bookName,
    bookAuthor,
    bookId,
    start_at,
    end_at
}: ReservedBookProps) {

    return (
        <div className={styles.container}>
            <div className={styles.colunaEsquerda}>
                <div className={styles.bookInfo}>
                    <p className={styles.name}>{bookName}</p>
                    <p>Livro: {bookId.slice(0, 6)}</p>
                </div>

                <div className={styles.bookInfo}>
                    <p className={styles.author}>De: {bookAuthor}</p>
                    <p className={styles.author}>Exemplar: 123412</p>
                </div>
            </div>

            <div className={styles.colunaDireita}>
                <div className={styles.dateInfo}>
                    <p>{start_at}</p>
                    <p>{end_at}</p>
                </div>
            </div>
        </div>
    );
}