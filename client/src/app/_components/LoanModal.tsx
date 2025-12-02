'use client';

import { useState } from 'react';
import { post } from '../api';
import styles from './LoanModal.module.css';
import { toast } from 'sonner';

interface LoanModalProps {
  itemId: string;
  userId: string;
  reservationId?: string;
  onClose: () => void;
}

export function LoanModal({ itemId, userId, reservationId, onClose }: LoanModalProps) {

  function toTimestamp(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}:00`).getTime();
  }

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loanCode, setLoanCode] = useState('');

  const today = new Date().toISOString().split("T")[0]; 
  const [loanData, setLoanData] = useState({
    startDate: today,
    startTime: '15:00',
    dueDate: today,
    endTime: '15:00'
  });

  const handleSubmit = async () => {
    try {
      const startTimestamp = toTimestamp(loanData.startDate, loanData.startTime);
      const endTimestamp = toTimestamp(loanData.dueDate, loanData.endTime);

      if (endTimestamp <= startTimestamp) {
        toast.error("A data e hora de término devem ser maiores que as de início.");
        return;
      }

      const token = localStorage.getItem('token');
      const response = await post('/loans', {
        itemID: itemId,
        userID: userId,
        startAt: startTimestamp,
        dueAt: endTimestamp,
        reservationID: reservationId
      }, token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao criar empréstimo.');
        return;
      }

      const data = await response.json();
      setLoanCode(data.code);
      setStep('success');
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error);
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

            <h2 className={styles.title}>Empréstimo</h2>

            <p className={styles.description}>
              Lembrete: Você deve retornar o exemplar na data e hora combinadas. Caso contrário, multas poderão serão aplicadas.
            </p>

            <div className={styles.formContainer}>
              <div className={styles.dateTimeGrid}>
                <div className={styles.headerRow}>
                  <label className={styles.columnHeader}>Data</label>
                  <label className={styles.columnHeader}>Hora</label>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Início:</label>
                    <input
                      type="date"
                      required
                      value={loanData.startDate}
                      onChange={(e) => setLoanData({ ...loanData, startDate: e.target.value })}
                      className={styles.input}
                      disabled
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelHidden}>Hora</label>
                    <input
                      type="time"
                      required
                      value={loanData.startTime}
                      onChange={(e) => setLoanData({ ...loanData, startTime: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Fim:</label>
                    <input
                      type="date"
                      required
                      value={loanData.dueDate}
                      onChange={(e) => setLoanData({ ...loanData, dueDate: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelHidden}>Hora</label>
                    <input
                      type="time"
                      required
                      value={loanData.endTime}
                      onChange={(e) => setLoanData({ ...loanData, endTime: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} className={styles.confirmButton}>
                Confirmar
              </button>
            </div>
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

            <h2 className={styles.successTitle}>Empréstimo Realizado!</h2>

            <div className={styles.reserveInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Código do Empréstimo:</span>
                <span className={styles.infoValue}>{loanCode}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Identificador do Exemplar:</span>
                <span className={styles.infoValue}>{itemId.slice(0,8)}</span>
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