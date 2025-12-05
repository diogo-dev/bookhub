"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from './SideBarLayout.module.css'

interface MenuItem {
  path: string;
  label: string;
}

interface SideLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
}

export function SideLayout({ children, menuItems }: SideLayoutProps) {
  const pathname = usePathname();

  const getIcon = (path: string) => {
    if (path.includes('profile')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
          <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor"/>
        </svg>
      );
    }
    if (path.includes('interests')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor"/>
        </svg>
      );
    }
    if (path.includes('loans')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4H18V6H2V4ZM2 8H14V10H2V8ZM2 12H16V14H2V12ZM2 16H12V18H2V16Z" fill="currentColor"/>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4H18V6H2V4ZM2 8H14V10H2V8ZM2 12H16V14H2V12Z" fill="currentColor"/>
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.icon}>{getIcon(item.path)}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
