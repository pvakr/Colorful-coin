"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/PageTransition"
import LoadingSpinner from "@/components/LoadingSpinner"

interface ToolWrapperProps {
  children: ReactNode
  title: string
  description?: string
  icon?: ReactNode
  isLoading?: boolean
  onBack?: () => void
}

export default function ToolWrapper({
  children,
  title,
  description,
  icon,
  isLoading = false,
  onBack,
}: ToolWrapperProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 px-6 py-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Back Button */}
                <motion.button
                  onClick={handleBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-white/90 ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-white/20 hover:ring-white/30"
                >
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                  <span className="hidden sm:inline">Back</span>
                </motion.button>

                {/* Title & Description */}
                <div>
                  <div className="flex items-center gap-3">
                    {icon && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25"
                      >
                        {icon}
                      </motion.div>
                    )}
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold text-white sm:text-3xl"
                    >
                      {title}
                    </motion.h1>
                  </div>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-1 text-sm text-white/60 sm:text-base"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Additional actions can be added here */}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mx-auto max-w-7xl p-6"
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-xl">
              {children}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}
