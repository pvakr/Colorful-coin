"use client";
import { motion } from "framer-motion";

export default function BigButton({ children, onClick, className = "", ariaLabel, disabled }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`rounded-2xl px-6 py-4 text-lg font-semibold shadow-[0_6px_20px_rgba(0,0,0,0.12)] ${
        disabled ? "opacity-50" : "hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
      } transition ${className}`}
    >
      {children}
    </motion.button>
  );
}
