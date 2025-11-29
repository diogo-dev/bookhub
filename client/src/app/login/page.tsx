"use client";

import { useState } from "react";
import { AuthForm } from "@/app/_components/AuthForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";

export default function Login() {

  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const fields = [
    { placeholder: "Email", type: "email", name: "email" },
    { placeholder: "Senha", type: "password", name: "password" },
  ];

  async function handleSubmit(data: Record<string, string>) {
    
    try {
      setLoading(true)

      await login(data.email, data.password);
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
