"use client"

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX, FiBook, FiHeart, FiList } from "react-icons/fi";
import { FaCircleUser } from "react-icons/fa6";
import styles from "./HeaderSidebar.module.css";

interface HeaderSidebarProps {
  userRoles: string[];
}

export function HeaderSidebar({ userRoles }: HeaderSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const getMenuItems = () => {
    const items = [];
    
    // Normalizar roles para comparação
    const normalizedRoles = userRoles.map(role => role.toUpperCase());
    const isAdmin = normalizedRoles.includes("ADMIN");
    const isEmployee = normalizedRoles.includes("EMPLOYEE");
    const isEmployeeOrAdmin = isAdmin || isEmployee;

    if (isEmployeeOrAdmin) {
      items.push(
        { href: "/admin-profile", label: "Meu Perfil", icon: <FaCircleUser /> },
        { href: "/manage-book", label: "Gestão de Livros", icon: <FiBook /> },
        { href: "/loan-book", label: "Empréstimo de Livros", icon: <FiBook /> },
        { href: "/return-book", label: "Devolução de Livro", icon: <FiBook /> },
        { href: "/user-query", label: "Consulta de Usuários", icon: <FaCircleUser /> }
      );
      
      // Apenas admin vê gestão de funcionários
      if (isAdmin) {
        items.push(
          { href: "/manage-employees", label: "Gestão de Funcionários", icon: <FaCircleUser /> }
        );
      }
    } else {
      // Usuário comum
      items.push(
        { href: "/user-profile", label: "Meu Perfil", icon: <FaCircleUser /> },
        { href: "/interests", label: "Lista de interesses", icon: <FiHeart /> },
        { href: "/loans", label: "Histórico de empréstimos", icon: <FiList /> }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Menu Toggle Button */}
      <button 
        className={styles.menuButton} 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <FiMenu />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2>Menu</h2>
          <button 
            className={styles.closeButton} 
            onClick={toggleSidebar}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href} 
              className={styles.navItem}
              onClick={() => setIsOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}