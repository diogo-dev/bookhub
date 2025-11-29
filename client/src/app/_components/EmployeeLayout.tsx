"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SideLayout } from "./SideBarLayout";

interface LayoutProps {
  children: ReactNode;
}

export function EmployeeLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  // colocar a página de descritores? { path: '/descritores', label: 'Gestão de descritores' }

  const menuItems = [
    { path: '/admin-profile', label: 'Meu Perfil' },
    { path: '/manage-book', label: 'Gestão de livros' },
    { path: '/loan-book', label: 'Empréstimo de livros' },
    { path: '/return-book', label: 'Devolução de livros' },
    { path: '/user-query', label: 'Consulta de usuários' }
  ];

  return (
    <SideLayout menuItems={menuItems}>
            {children}
    </SideLayout>
  );
}
