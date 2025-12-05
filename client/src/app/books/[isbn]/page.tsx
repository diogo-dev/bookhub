import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/app/_components/BookCover";
import { Expand } from "@/app/_components/Expand";
import { get, post } from "@/app/api";
import { BookDetailsClient } from "@/app/_components/BookDetailClient";

import styles from "./page.module.css";

interface Book {
  workID?: string;
  title: string;
  subtitle: string;
  description: string;
  authors: {
    ID: string;
    name: string;
  }[];
  publisher?: {
    name: string;
    displayName: string;
  } | null;
  categoryTree?: {
    ID: string;
    name: string;
    decimal: string;
    level: number;
  }[];
  cover?: string;
  edition?: string;
  language?: {
    isoCode: string;
    name: string;
  };
  numberOfPages: number;
  numberOfVisits: number;
  createdAt: number;
}

export default async function BookDetails(props: {
  params: Promise<{ isbn: string }>;
}) {
  const { isbn } = await props.params;
  const response = await get(`/books/${isbn}`);
  const itemsResponse = await get(`/books/${isbn}/items`);

  if (response.status == 404) {
    notFound();
  } else if (response.status != 200) {
    return <h1 className={styles.error}>{response.status} {response.statusText}</h1>;
  }

  post(`/books/${isbn}/visits`);

  const book: Book = await response.json();
  const items = await itemsResponse.json();

  return (
    <BookDetailsClient 
      isbn={isbn} 
      book={book} 
      items={items} 
    />
  );
}
