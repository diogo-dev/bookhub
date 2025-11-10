"use client";

import { useState } from "react";
import { AuthForm } from "@/app/_components/AuthForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export default function Login() {

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const fields = [
    { placeholder: "Email", type: "email", name: "email" },
    { placeholder: "Senha", type: "password", name: "password" },
  ];

  async function handleSubmit(data: Record<string, string>) {
    
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.auth.login, {
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
      toast.success("Login realizado com sucesso!", {duration: 2000});
      setTimeout(() => router.push('/'), 1000);

    } catch (error: any) {
      toast.error(error.message || "Email ou senha inválidos", {duration: 2000});
    } finally {
      setLoading(false);
    }

  }

  function handleBottomLinkClick() {
    router.push('/register');
  }

  return (
    <AuthForm
      title="Login"
      fields={fields}
      buttonText="Entrar"
      bottomText="Não possui uma conta?"
      bottomLinkText="Cadastre-se"
      onSubmit={handleSubmit}
      onBottomLinkClick={handleBottomLinkClick}
      disabled={loading}
    />
  );

}
