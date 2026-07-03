import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black">
      <Navbar />
      <div className="grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center relative shadow-sm border border-amber-500/20">
              <FileQuestion className="w-12 h-12 text-amber-500" />
              <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce">🥭</div>
            </div>
          </div>
          
          <div className="space-y-3 font-sans">
            <h1 className="text-6xl font-serif-heading font-black text-hero-text">404</h1>
            <h2 className="text-xl font-bold text-hero-text">Page Not Found</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Oops! We couldn't find the page you're looking for. It might have been moved or the mangoes might be out of season.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 font-sans">
            <Link 
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md"
            >
              Go to Homepage
            </Link>
            <Link 
              href="/products"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 hover:bg-emerald-500/20 text-sm transition-all"
            >
              Shop Mangoes
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
