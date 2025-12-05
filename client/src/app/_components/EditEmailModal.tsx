'use client';

import { useState } from 'react';
import { patch } from '../api';
import styles from './EditEmailModal.module.css';
import { toast } from 'sonner';

interface EditEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEmailModal({ currentEmail, onClose, onSuccess }: EditEmailModalProps) {
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("O email não pode estar vazio.");
      return;
    }

    if (!validateEmail(email.trim())) {
      toast.error("Por favor, digite um email válido.");
      return;
    }

    if (email.trim() === currentEmail) {
      toast.info("Nenhuma alteração foi feita.");
      onClose();
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await patch('/me', { email: email.trim() }, token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar email.');
        return;
      }

      toast.success("Email atualizado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar email:', error);
      toast.error('Erro ao atualizar email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <button onClick={onClose} className={styles.closeButton} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.title}>Alterar Email</h2>
            <p className={styles.description}>
              Digite o novo email que deseja usar na sua conta. Você precisará usar este email para fazer login.
            </p>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="seu@email.com"
                maxLength={255}
              />
            </div>

            <button 
              onClick={handleSubmit} 
              className={styles.confirmButton}
              disabled={loading || !email.trim() || !validateEmail(email.trim())}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Atualizando...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                  </svg>
                  Confirmar Alteração
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

