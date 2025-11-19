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
              {item.label}
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
