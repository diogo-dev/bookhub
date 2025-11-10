"use client";

import { useState } from "react"; 
import { AuthForm } from "@/app/_components/AuthForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export default function Register() {

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const fields = [
    { placeholder: "Nome", type: "text", name: "name" },
    { placeholder: "Email", type: "email", name: "email" },
    { placeholder: "CPF", type: "text", name: "cpf" },
    { placeholder: "Senha", type: "password", name: "password" },
  ];

  async function handleSubmit(data: Record<string, string>) {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer login");
      }

      const result = await response.json();
      localStorage.setItem("token", result.token);
      toast.success("Conta criada com sucesso!", {duration: 2000});
      setTimeout(() => router.push('/login'), 1000);
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar", {duration: 2000});
    } finally {
      setLoading(false);
    }
  }

  function handleBottomLinkClick() {
    router.push('/login');
  }

  return (
    <AuthForm
      title="Cadastro"
      fields={fields}
      buttonText="Cadastrar"
      bottomText="Já possui uma conta?"
      bottomLinkText="Faça login"
      onSubmit={handleSubmit}
      onBottomLinkClick={handleBottomLinkClick}
      disabled={loading}
    />
  );
}
