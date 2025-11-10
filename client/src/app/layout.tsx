import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { Toaster } from "sonner";

import "./globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "BookHub",
  description: "a library app"
};

const roboto = Roboto({
  subsets: ["latin"]
})

export default function RootLayout(props: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className={[roboto.className, styles.container].join(" ")}>
        <Header />
        <main>{props.children}</main>
        <Footer />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
