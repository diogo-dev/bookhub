"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IoSearch } from "react-icons/io5";
import styles from "./SearchBar.module.css";

export function SearchBar() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputContainer}>
        <IoSearch size={24} />
        <input
          name="book"
          type="text"
          placeholder="Pesquise por livros, autores, gêneros..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
    </form>
  );
}

