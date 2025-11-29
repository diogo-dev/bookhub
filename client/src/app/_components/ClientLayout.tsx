"use client";

import { ReactNode } from "react";
import { SideLayout } from "./SideBarLayout";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    { path: '/user-profile', label: 'Meu Perfil' },
    { path: '/interests', label: 'Lista de interesses' },
    { path: '/loans', label: 'Histórico de empréstimos' }
  ];

  return (
    <SideLayout menuItems={menuItems}>
        {children}
    </SideLayout>
  );
}
