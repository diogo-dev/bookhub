"use client"

import Link from "next/link";
import styles from "./Header.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { FiLogOut } from "react-icons/fi";
import { HeaderSidebar } from "./HeaderSidebar";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();  

  const handleLogout = () => {
    logout();
  };

  const handleOnClick = () => {
    router.push("/login")
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftSection}>
          {/* Sidebar aparece apenas quando usuário está autenticado */}
          {isAuthenticated && user && (
            <HeaderSidebar userRoles={user.roles} />
          )}
          
          <Link href="/" className={styles.logoLink}>
            <Image 
              src="/images/bookhub_icon.png" 
              alt="BookHub" 
              width={40} 
              height={40}
              className={styles.logo}
              priority
            />
            <span>BookHub</span>
          </Link>
        </div>

        
        <nav>
          {isAuthenticated ? (
            <div className={styles.userSection}>
              <span className={styles.userName}>Olá, {user?.name}</span>
              <button 
                className={styles.logoutButton}
                onClick={handleLogout}
                title="Sair"
              >
                <FiLogOut />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <>
              <Link href="/register" className={styles.registerLink}>Cadastro</Link>
              <button className={styles.loginButton} onClick={handleOnClick}>
                Login
              </button>
            </>
          )}

        </nav>
      </div>
    </div>
  );
}
