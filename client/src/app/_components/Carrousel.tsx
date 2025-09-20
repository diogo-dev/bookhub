"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

import styles from "./Carrousel.module.css";

export function Carrousel(props: { children: ReactNode; }) {
  const [step, setStep] = useState(0);

  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateWidth() {
      if (contentRef.current) {
        setScrollWidth(contentRef.current.scrollWidth);
        setClientWidth(contentRef.current.clientWidth);
        setStep(0);
      }
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [contentRef.current]);

  const maxSteps = Math.floor(scrollWidth / clientWidth);
  const left = - Math.min(scrollWidth - clientWidth, step * clientWidth) + "px";

  return (
    <div className={styles.container}>
      <button
        disabled={step == 0 || clientWidth == 0}
        onClick={() => setStep(step - 1)}
        children={<MdKeyboardArrowLeft size={30} />}
      />

      <button
        disabled={step == maxSteps || clientWidth == 0}
        onClick={() => setStep(step + 1)}
        children={<MdKeyboardArrowRight size={30} />}
      />

      <div className={styles.contentBox}>
        <div ref={contentRef} className={styles.content} style={{ left }}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
