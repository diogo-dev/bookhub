"use client"

import { useState } from "react";
import styles from "./BookRecordCard.module.css"

interface BookRecordCardProps {
    bookName:string;
    bookAuthor:string;
    bookId: string;
    itemId: string;
    start_at: string;
    end_at: string;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function BookRecordCard({
    bookName,
    bookAuthor,
    bookId,
    itemId,
    start_at,
    end_at,
    isSelected,
    onSelect
}: BookRecordCardProps) {

    function formatDateFromBigint(value: string | number): string {
        const date = new Date(Number(value));

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    }

    return (
        <div 
            className={`${styles.container} ${isSelected ? styles.selected : ''}`} 
            onClick={onSelect}
        >
            <div className={styles.colunaEsquerda}>
                <div className={styles.bookInfo}>
                    <p className={styles.name}>{bookName}</p>
                    <p className={styles.bookID}>Livro: {bookId}</p>
                </div>

                <div className={styles.bookInfo}>
                    <p className={styles.author}>De: {bookAuthor}</p>
                    <p className={styles.itemID}>Exemplar: {itemId.slice(0, 6)}</p>
                </div>
            </div>

            <div className={styles.colunaDireita}>
                <div className={styles.dateInfo}>
                    <p>{formatDateFromBigint(start_at)}</p>
                    <p>{formatDateFromBigint(end_at)}</p>
                </div>
            </div>
        </div>
    );
}