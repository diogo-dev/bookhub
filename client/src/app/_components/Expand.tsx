"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import styles from "./Expand.module.css";

export function Expand(props: {
  children: ReactNode;
  className?: string;
  maxHeight: number;
}) {
  const [contentHeight, setContentHeight] = useState(0);
  const [maxHeight, setMaxHeight] = useState<number | null>(props.maxHeight);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current)
      setContentHeight(contentRef.current.scrollHeight);
  }, [contentRef.current]);

  return (
    <div className={styles.container}>
      <div
        ref={contentRef}
        children={props.children}
        className={[styles.content, props.className].join(" ")}
        style={{ maxHeight: maxHeight ? `${maxHeight}px` : "none" }}
      />

      <div
        className={styles.expand}
        onClick={() => setMaxHeight(maxHeight == null ? props.maxHeight : null)}
        style={{ display: contentHeight > props.maxHeight ? "block" : "none" }}
      >
        <span>{maxHeight == null ? "Mostrar menos" : "Mostrar mais"}</span>
      </div>
    </div>
  );
}
