import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between font-sans">
      <Navbar />
      <div className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        {/* Shimmer Hero Area */}
        <div className="w-full h-48 md:h-72 bg-muted-bg rounded-3xl mb-12 border border-border/50 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>
        
        {/* Shimmer Title */}
        <div className="w-48 h-8 bg-muted-bg rounded-xl mb-8 animate-pulse"></div>
        
        {/* Shimmer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-4 animate-pulse">
              <div className="w-full h-48 bg-muted-bg rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              </div>
              <div className="w-3/4 h-4 bg-muted-bg rounded-md"></div>
              <div className="w-1/2 h-3 bg-muted-bg rounded-md"></div>
              <div className="w-full h-10 bg-muted-bg rounded-xl mt-2"></div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
