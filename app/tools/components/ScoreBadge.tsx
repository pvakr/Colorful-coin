"use client";
import { motion } from "framer-motion";

export default function ScoreBadge({ label = "Score", value = 0 }: { label?: string; value: number }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 font-bold text-slate-800 shadow-lg ring-1 ring-black/5"
    >
      <span className="text-xl">⭐</span>
      <span>{label}:</span>
      <span className="text-xl">{value}</span>
    </motion.div>
  );
}
