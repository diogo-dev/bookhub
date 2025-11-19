import Link from "next/link";
import { FaBook } from "react-icons/fa";
import styles from "./Header.module.css";

export function Header() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/">
          <FaBook />
          <span>BookHub</span>
        </Link>
        <nav>
          <Link href="/register">Register</Link>
          <Link href="/login">Login</Link>
        </nav>
      </div>
    </div>
  );
}
