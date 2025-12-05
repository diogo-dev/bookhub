'use client';

import { useState } from 'react';
import { del } from '../api';
import styles from './DeleteAccountModal.module.css';
import { toast } from 'sonner';
import { useAuth } from '../_context/AuthContext';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const confirmationText = 'DELETAR';
  const isConfirmed = confirmText === confirmationText;

  const handleSubmit = async () => {
    if (!isConfirmed) {
      toast.error(`Digite "${confirmationText}" para confirmar.`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await del('/me', token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao deletar conta.');
        return;
      }

      toast.success("Conta deletada com sucesso!");
      logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast.error('Erro ao deletar conta.');
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
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.title}>Deletar Conta</h2>
            <p className={styles.description}>
              Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente removidos.
            </p>
          </div>

          <div className={styles.warningBox}>
            <div className={styles.warningIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.warningContent}>
              <h3 className={styles.warningTitle}>Atenção!</h3>
              <ul className={styles.warningList}>
                <li>Todos os seus dados pessoais serão removidos</li>
                <li>Seus empréstimos e reservas serão cancelados</li>
                <li>Esta ação não pode ser desfeita</li>
              </ul>
            </div>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Para confirmar, digite <strong className={styles.confirmText}>{confirmationText}</strong>:
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={styles.input}
                placeholder={confirmationText}
              />
            </div>

            <div className={styles.buttonsContainer}>
              <button 
                onClick={onClose} 
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit} 
                className={styles.deleteButton}
                disabled={loading || !isConfirmed}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Deletando...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5H5H17M7 5V3C7 2.46957 7.21071 1.96086 7.58579 1.58579C7.96086 1.21071 8.46957 1 9 1H11C11.5304 1 12.0391 1.21071 12.4142 1.58579C12.7893 1.96086 13 2.46957 13 3V5M15 5V17C15 17.5304 14.7893 18.0391 14.4142 18.4142C14.0391 18.7893 13.5304 19 13 19H7C6.46957 19 5.96086 18.7893 5.58579 18.4142C5.21071 18.0391 5 17.5304 5 17V5H15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Deletar Conta Permanentemente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

