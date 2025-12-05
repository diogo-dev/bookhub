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
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                </svg>
              </div>
              <h2 className={styles.title}>Criar Empréstimo</h2>
              <p className={styles.description}>
                Defina as datas e horários de início e término do empréstimo. Lembre-se: você deve retornar o exemplar na data e hora combinadas, caso contrário, multas poderão ser aplicadas.
              </p>
            </div>

            <div className={styles.formContainer}>
              <div className={styles.dateTimeGrid}>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}>
                        <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Data e Hora de Início:
                    </label>
                    <div className={styles.dateTimeInputs}>
                      <input
                        type="date"
                        required
                        value={loanData.startDate}
                        onChange={(e) => setLoanData({ ...loanData, startDate: e.target.value })}
                        className={styles.input}
                        disabled
                      />
                      <input
                        type="time"
                        required
                        value={loanData.startTime}
                        onChange={(e) => setLoanData({ ...loanData, startTime: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}>
                        <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Data e Hora de Término:
                    </label>
                    <div className={styles.dateTimeInputs}>
                      <input
                        type="date"
                        required
                        value={loanData.dueDate}
                        onChange={(e) => setLoanData({ ...loanData, dueDate: e.target.value })}
                        className={styles.input}
                      />
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
              </div>

              <button onClick={handleSubmit} className={styles.confirmButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
                Confirmar Empréstimo
              </button>
            </div>
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

            <h2 className={styles.successTitle}>Empréstimo Realizado com Sucesso!</h2>
            <p className={styles.successDescription}>
              O empréstimo foi criado e o exemplar está disponível para retirada.
            </p>

            <div className={styles.reserveInfo}>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Código do Empréstimo:</span>
                  <span className={styles.infoValue}>{loanCode}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Identificador do Exemplar:</span>
                  <span className={styles.infoValue}>{itemId.slice(0,8)}</span>
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