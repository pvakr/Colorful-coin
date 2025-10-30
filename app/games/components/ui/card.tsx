import type { ReactNode } from "react"

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white/85 backdrop-blur shadow-xl ${className}`}>{children}</div>
}

export function CardBody({ children, className = "p-6" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
