import { Navbar, BottomNav } from './Navbar'
import { BetSlip } from '@/components/betting/BetSlip'
import { Toaster } from 'react-hot-toast'

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />
      {/* pb-32 on mobile = 128px clears both the fixed BottomNav (56px) and BetSlip */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32 sm:pb-24">
        {children}
      </main>
      <BottomNav />
      <BetSlip />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f2044',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#0f2044' },
          },
          error: {
            iconTheme: { primary: '#ff2d55', secondary: '#0f2044' },
          },
        }}
      />
    </div>
  )
}
