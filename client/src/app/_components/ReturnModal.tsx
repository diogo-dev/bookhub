'use client';

import { useState } from 'react';
import styles from './ReturnModal.module.css';
import { patch } from '../api';
import { toast } from 'sonner';

interface ReserveModalProps {
  selectedLoan: {
    loanID: string;
    loanCode: string;
    startAt: string;
    dueAt: string;
    loanStatus: string;
    itemStatus: string;
    itemID: string;
    bookTitle: string;
    bookIsbn: string;
    authors: string[];
  }
  onClose: () => void;
}

export function ReturnModal({ selectedLoan, onClose }: ReserveModalProps) {

    const [step, setStep] = useState<'form' | 'success'>('form');
    const [returnedLoan, setReturnedLoan] = useState<any>(null);
    const [returnedItem, setReturnedItem] = useState<any>(null);
  
    const handleDelay = (dueAt: string): string => {
        const target = Number(dueAt);
        const now = Date.now();

        if (target >= now) {
            return "00h00m";
        }

        const diffMs = now - target;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const pad = (n: number) => n.toString().padStart(2, "0");

        return `${pad(days)}dias   ${pad(hours)}h${pad(minutes)}m`;
    };


    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token não encontrado');

            const res = await patch(`/loans/${selectedLoan.loanID}/return`, undefined,  token);

            if (!res.ok) {
              const error = await res.json();
              toast.error(error.message || "Erro ao buscar usuário.");
              return;
            }

            const data = await res.json();
            console.log(data);
            setReturnedLoan(data.loan);
            setReturnedItem(data.item);
            setStep('success');
        } catch (error) {
          console.error('Erro ao criar reserva:', error);
        }
    };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {step === 'form' ? (
          <div className={styles.content}>
                <button onClick={onClose} className={styles.closeButton}>
                ×
                </button>

                <h2 className={styles.title}>Devolução</h2>

                <p className={styles.description}>
                    Confirme os dados do empréstimo abaixo para prosseguir com a devolução
                </p>

                <hr className={styles.separator} />

                <div className={styles.loanDetails}>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Código do empréstimo:</span>
                        <span className={styles.value}>{selectedLoan.loanCode}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Status do empréstimo:</span>
                        <span className={styles.value}>{selectedLoan.loanStatus.toUpperCase()}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Título:</span>
                        <span className={styles.value}>{selectedLoan.bookTitle}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>ISBN:</span>
                        <span className={styles.value}>{selectedLoan.bookIsbn}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Atraso:</span>
                        <span className={styles.value}>{handleDelay(selectedLoan.dueAt)}</span>
                    </div>
                </div>

                <button onClick={handleSubmit} className={styles.confirmButton}>
                    Confirmar
                </button>
            </div>
        ) : (
          <div className={styles.successContent}>
            <button onClick={onClose} className={styles.closeButton}>
              ×
            </button>

            <div className={styles.checkmarkCircle}>
              <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
                <path 
                  d="M2 15L15 28L38 2" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className={styles.successTitle}>Devolução bem sucedida!</h2>

            <div className={styles.loanDetails}>
              <div className={styles.detailRow}>
                  <span className={styles.label}>Código do empréstimo:</span>
                  <span className={styles.value}>{returnedLoan.code}</span>
              </div>
              <div className={styles.detailRow}>
                  <span className={styles.label}>Status do empréstimo:</span>
                  <span className={styles.value}>{returnedLoan.status.toUpperCase()}</span>
              </div>
              <div className={styles.detailRow}>
                  <span className={styles.label}>Status do exemplar:</span>
                  <span className={styles.value}>{returnedItem.status.toUpperCase()}</span>
              </div>
            </div>

            <button onClick={onClose} className={styles.closeButtonBottom}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}