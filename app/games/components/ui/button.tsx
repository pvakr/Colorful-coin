import type { ButtonHTMLAttributes } from "react"

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium shadow hover:shadow-md active:scale-[0.98] transition ${className}`}
      {...props}
    />
  )
}
