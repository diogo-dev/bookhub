'use client';

import { useState } from 'react';
import { patch } from '../api';
import styles from './EditNameModal.module.css';
import { toast } from 'sonner';

interface EditNameModalProps {
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditNameModal({ currentName, onClose, onSuccess }: EditNameModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio.");
      return;
    }

    if (name.trim() === currentName) {
      toast.info("Nenhuma alteração foi feita.");
      onClose();
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await patch('/me', { name: name.trim() }, token);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar nome.');
        return;
      }

      toast.success("Nome atualizado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome.');
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
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className={styles.title}>Alterar Nome</h2>
            <p className={styles.description}>
              Digite o novo nome que deseja usar na sua conta.
            </p>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nome Completo:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Digite seu nome completo"
                maxLength={255}
              />
            </div>

            <button 
              onClick={handleSubmit} 
              className={styles.confirmButton}
              disabled={loading || !name.trim()}
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

