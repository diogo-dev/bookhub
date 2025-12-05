'use client';

import { useState } from 'react';
import { post } from '../api';
import styles from './ReserveModal.module.css';
import { toast } from 'sonner';

interface ReserveModalProps {
  itemId: string;
  onClose: () => void;
}

export function ReserveModal({ itemId, onClose }: ReserveModalProps) {

  function toTimestamp(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}:00`).getTime();
  }

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [reserveCode, setReserveCode] = useState('');

  const today = new Date().toISOString().split("T")[0]; 
  const [reserveData, setReserveData] = useState({
    startDate: today,
    startTime: '15:00',
    endDate: today,
    endTime: '15:00'
  });

  const handleSubmit = async () => {
    try {
      const startTimestamp = toTimestamp(reserveData.startDate, reserveData.startTime);
      const endTimestamp = toTimestamp(reserveData.endDate, reserveData.endTime);

      if (endTimestamp <= startTimestamp) {
        toast.error("A data e hora de término devem ser maiores que as de início.");
        return;
      }

      const token = localStorage.getItem('token');
      const response = await post('/reservations', {
        itemID: itemId,
        startAt: startTimestamp,
        endAt: endTimestamp,
      }, token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao criar reserva.');
        return;
      }

      const data = await response.json();
      setReserveCode(data.code);
      setStep('success');
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
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
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM15 16H7V14H15V16ZM17 8H7V6H17V8Z" fill="currentColor"/>
                </svg>
              </div>
              <h2 className={styles.title}>Criar Reserva</h2>
              <p className={styles.description}>
                Defina as datas e horários de início e término da reserva. Para efetuar o empréstimo, você deverá comparecer na biblioteca dentro do prazo especificado.
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
                        value={reserveData.startDate}
                        onChange={(e) => setReserveData({ ...reserveData, startDate: e.target.value })}
                        className={styles.input}
                      />
                      <input
                        type="time"
                        required
                        value={reserveData.startTime}
                        onChange={(e) => setReserveData({ ...reserveData, startTime: e.target.value })}
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
                        value={reserveData.endDate}
                        onChange={(e) => setReserveData({ ...reserveData, endDate: e.target.value })}
                        className={styles.input}
                      />
                      <input
                        type="time"
                        required
                        value={reserveData.endTime}
                        onChange={(e) => setReserveData({ ...reserveData, endTime: e.target.value })}
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
                Confirmar Reserva
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

            <h2 className={styles.successTitle}>Reserva Criada com Sucesso!</h2>
            <p className={styles.successDescription}>
              A reserva foi criada. Compareça na biblioteca dentro do prazo especificado para efetuar o empréstimo.
            </p>

            <div className={styles.reserveInfo}>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Código da Reserva:</span>
                  <span className={styles.infoValue}>{reserveCode}</span>
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