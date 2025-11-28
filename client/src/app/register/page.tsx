"use client";

import { useState } from "react"; 
import { AuthForm } from "@/app/_components/AuthForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function Register() {

  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const fields = [
    { placeholder: "Nome", type: "text", name: "name" },
    { placeholder: "Email", type: "email", name: "email" },
    { placeholder: "CPF", type: "text", name: "cpf" },
    { placeholder: "Senha", type: "password", name: "password" },
  ];

  async function handleSubmit(data: Record<string, string>) {
    try {
      setLoading(true)
      await register(data.name, data.email, data.cpf, data.password);
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
