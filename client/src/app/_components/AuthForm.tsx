"use client";

import React, { useState } from 'react';
import styles from './AuthForm.module.css';

interface FormField {
  placeholder: string;
  type?: string;
  name: string;
}

interface FormProps {
  title: string;
  fields: FormField[];
  buttonText: string;
  bottomText: string;
  bottomLinkText: string;
  onSubmit: (data: Record<string, string>) => void;
  onBottomLinkClick: () => void;
  disabled?: boolean;
}

export function AuthForm({
  title,
  fields,
  buttonText,
  bottomText,
  bottomLinkText,
  onSubmit,
  onBottomLinkClick,
  disabled
}: FormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  function formatCPF(value: string): string {
    const numbers = value.replace(/\D/g, '');
    const cpf = numbers.slice(0, 11);
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
              .slice(0, 14); 
  }

  function removeCPFMask(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  function handleChange(name: string, value: string ) {
    if (name === 'cpf') {
      value = formatCPF(value);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }


  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const processedData = { ...formData };
    
    if (processedData.cpf) {
      processedData.cpf = removeCPFMask(processedData.cpf);
    }

    onSubmit(processedData);
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>{title}</h1>

      <form 
        onSubmit={handleFormSubmit} 
        className={styles.form}
      >
        {fields.map((field, index) => (
          <input
            key={index}
            type={field.type || 'text'}
            placeholder={field.placeholder}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={styles.input}
            required
          />
        ))}

        <button type="submit" className={styles.button} disabled={disabled}>
          {buttonText}
        </button>

      </form>

      <p className={styles.bottomText}>
        {bottomText}{' '}
        <a onClick={onBottomLinkClick} className={styles.link}>
          {bottomLinkText}
        </a>
      </p>
      
    </div>
  );
}
