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

  const isOverdue = Number(selectedLoan.dueAt) < Date.now();
  const delay = handleDelay(selectedLoan.dueAt);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step === 'form' ? (
          <div className={styles.content}>
            <button onClick={onClose} className={styles.closeButton} aria-label="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className={styles.header}>
              <div className={styles.iconContainer}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
              </div>
              <h2 className={styles.title}>Confirmar Devolução</h2>
              <p className={styles.description}>
                Confirme os dados do empréstimo abaixo para prosseguir com a devolução
              </p>
            </div>

            <div className={styles.loanDetails}>
              <div className={styles.detailCard}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Código do Empréstimo:</span>
                  <span className={styles.value}>{selectedLoan.loanCode}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Status:</span>
                  <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                    {selectedLoan.loanStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className={styles.detailCard}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Título do Livro:</span>
                  <span className={styles.value}>{selectedLoan.bookTitle}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>ISBN:</span>
                  <span className={styles.value}>{selectedLoan.bookIsbn}</span>
                </div>
                {selectedLoan.authors && selectedLoan.authors.length > 0 && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Autor(es):</span>
                    <span className={styles.value}>{selectedLoan.authors.filter(a => a).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className={`${styles.detailCard} ${isOverdue ? styles.overdueCard : ''}`}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Atraso:</span>
                  <span className={`${styles.value} ${isOverdue ? styles.overdueValue : styles.onTime}`}>
                    {isOverdue ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                        </svg>
                        {delay}
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px' }}>
                          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                        </svg>
                        No prazo
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} className={styles.confirmButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              Confirmar Devolução
            </button>
          </div>
        ) : (
          <div className={styles.successContent}>
            <button onClick={onClose} className={styles.closeButton} aria-label="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className={styles.checkmarkCircle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className={styles.successTitle}>Devolução Realizada com Sucesso!</h2>
            <p className={styles.successDescription}>
              O livro foi devolvido e o exemplar está disponível novamente.
            </p>

            <div className={styles.loanDetails}>
              <div className={styles.detailCard}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Código do Empréstimo:</span>
                  <span className={styles.value}>{returnedLoan?.code || selectedLoan.loanCode}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Status do Empréstimo:</span>
                  <span className={`${styles.statusBadge} ${styles.statusReturned}`}>
                    {returnedLoan?.status?.toUpperCase() || 'DEVOLVIDO'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Status do Exemplar:</span>
                  <span className={`${styles.statusBadge} ${styles.statusAvailable}`}>
                    {returnedItem?.status?.toUpperCase() || 'DISPONÍVEL'}
                  </span>
                </div>
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