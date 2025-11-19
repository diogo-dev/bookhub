"use client";

import { useState } from "react";
import { FaRegImage } from "react-icons/fa6";
import Image from "next/image";
import styles from "./BookCover.module.css";

export function BookCover(props: { coverID?: string }) {
  const [error, setError] = useState(false);

  return props.coverID && !error
    ? <Image
        className={styles.cover}
        src={urlOfImage(props.coverID)}
        alt=""
        width={237}
        height={277}
        onError={() => setError(true)} />
    : <div className={[styles.cover, styles.error].join(" ")} children={<FaRegImage />} />;
}

function urlOfImage(coverID: string) {
  const route = "/id";
  const size = "-M";
  const extension = ".jpg";
  const connector = coverID.startsWith("/") ? "" : "/";
  return process.env.NEXT_PUBLIC_IMAGE_CDN + route + connector + coverID + size + extension;
}
