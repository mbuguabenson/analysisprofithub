"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Globe, Database, Lock, Gauge } from "lucide-react"

interface LoadingStep {
  id: string
  label: string
  status: "pending" | "loading" | "complete"
  icon: any
}

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: "connect", label: "Connecting Network", status: "pending", icon: Globe },
    { id: "auth", label: "Authenticating", status: "pending", icon: Lock },
    { id: "data", label: "Loading Data", status: "pending", icon: Database },
    { id: "sync", label: "Synchronizing", status: "pending", icon: Gauge },
    { id: "ready", label: "Ready", status: "pending", icon: Zap },
  ])

  useEffect(() => {
    const sequence = async () => {
      // Phase 0: Initializing Glow
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsInitializing(false)

      // Phase 1: Progressive Loading
      for (let i = 0; i < steps.length; i++) {
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "loading" } : s))
        const stepProgress = (i + 1) * (100 / steps.length)
        await animateTo(stepProgress, 800)
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "complete" } : s))
      }

      await new Promise(resolve => setTimeout(resolve, 800))
      onComplete()
    }

    sequence()
  }, [])

  const animateTo = (target: number, duration: number) => {
    return new Promise<void>(resolve => {
      const start = progress
      const startTime = Date.now()

      const update = () => {
        const elapsed = Date.now() - startTime
        const ratio = Math.min(elapsed / duration, 1)
        const current = start + (target - start) * ratio
        setProgress(current)
        if (ratio < 1) requestAnimationFrame(update)
        else resolve()
      }
      requestAnimationFrame(update)
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-30" />
      </div>

      <AnimatePresence mode="wait">
        {isInitializing ? (
          <motion.div
            key="init"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-6"
            style={{ zIndex: 10 }}
          >
            {/* Minimal Spinner */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 animate-spin" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300" />
                <circle 
                  cx="25" 
                  cy="25" 
                  r="20" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeDasharray="31.4 125.6"
                  className="text-gray-900"
                />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-semibold text-gray-900 tracking-wide">Initializing</h2>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-md px-6 flex flex-col items-center"
            style={{ zIndex: 10 }}
          >
            {/* Logo Section */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-900 text-white font-bold mb-4"
              >
                A
              </motion.div>
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-semibold text-gray-900 tracking-tight"
              >
                AnalysisProfitHub
              </motion.h1>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs text-gray-500 uppercase tracking-wider mt-1"
              >
                Trading Platform
              </motion.p>
            </div>

            {/* Step List */}
            <div className="w-full space-y-2 mb-8">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {step.status === "complete" ? (
                      <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : step.status === "loading" ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm ${step.status === "complete" ? "text-gray-600" : step.status === "loading" ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600 font-medium">Loading</span>
                <span className="text-xs text-gray-600 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gray-900 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
