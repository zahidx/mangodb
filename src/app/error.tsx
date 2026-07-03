'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // In production, log the error to Sentry, LogRocket, or Datadog
    console.error('MangoDB Runtime Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black">
      <Navbar />
      <div className="grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-8 bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-8 shadow-sm font-sans animate-fade-in">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-hero-text">Something went wrong</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We encountered an unexpected error while rendering this page. Our engineers have been notified.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => reset()}
              className="w-full px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
