'use client';

import { useState } from 'react';
import { patch } from '../api';
import styles from './ChangePasswordModal.module.css';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("A nova senha deve ser diferente da senha atual.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await patch('/me', {
        password: passwordData.newPassword
      }, token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao alterar senha.');
        return;
      }

      setStep('success');
      toast.success("Senha alterada com sucesso!");
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha.');
    } finally {
      setLoading(false);
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
                  <path d="M12 1L15.09 8.26L23 9.27L17 14.14L18.18 22.02L12 18.77L5.82 22.02L7 14.14L1 9.27L8.91 8.26L12 1Z" fill="currentColor"/>
                </svg>
              </div>
              <h2 className={styles.title}>Alterar Senha</h2>
              <p className={styles.description}>
                Digite sua senha atual e escolha uma nova senha segura. A senha deve ter pelo menos 6 caracteres.
              </p>
            </div>

            <div className={styles.formContainer}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Senha Atual:
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={styles.input}
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Nova Senha:
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={styles.input}
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}>
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                  </svg>
                  Confirmar Nova Senha:
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={styles.input}
                  placeholder="Confirme a nova senha"
                />
              </div>

              <button 
                onClick={handleSubmit} 
                className={styles.confirmButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Alterando...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                    </svg>
                    Alterar Senha
                  </>
                )}
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

            <h2 className={styles.successTitle}>Senha Alterada com Sucesso!</h2>
            <p className={styles.successDescription}>
              Sua senha foi alterada com sucesso. Use a nova senha na próxima vez que fizer login.
            </p>

            <button onClick={onClose} className={styles.closeButtonBottom}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

