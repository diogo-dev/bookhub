"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SideLayout } from "./SideBarLayout";
import { useAuth } from "../_context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function EmployeeLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Verificar se o usuário é ADMIN
  const isAdmin = user?.roles?.some(role => role.toUpperCase() === 'ADMIN') || false;

  // colocar a página de descritores? { path: '/descritores', label: 'Gestão de descritores' }

  const menuItems = [
    { path: '/admin-profile', label: 'Meu Perfil' },
    { path: '/manage-book', label: 'Gestão de livros' },
    { path: '/loan-book', label: 'Empréstimo de livros' },
    { path: '/return-book', label: 'Devolução de livros' },
    { path: '/user-query', label: 'Consulta de usuários' },
    ...(isAdmin ? [{ path: '/manage-employees', label: 'Gestão de Funcionários' }] : [])
  ];

  return (
    <SideLayout menuItems={menuItems}>
            {children}
    </SideLayout>
  );
}
