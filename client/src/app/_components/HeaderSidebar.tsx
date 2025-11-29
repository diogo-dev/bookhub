"use client"

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX, FiBook } from "react-icons/fi";
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

    if (userRoles.includes("ADMIN")) {
      items.push(
        { href: "/admin-profile", label: "Meu Perfil", icon: <FaCircleUser />, roles: ["ADMIN"] },
        { href: "/manage-book", label: "Gestão de Livros", icon: <FiBook />, roles: ["ADMIN"] },
        { href: "/return-book", label: "Devolução de Livro", icon: <FiBook />, roles: ["ADMIN"] }
      );
    } else {
      items.push(
        { href: "/user-profile", label: "Meu Perfil", icon: <FaCircleUser />, roles: ["USER"] }
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