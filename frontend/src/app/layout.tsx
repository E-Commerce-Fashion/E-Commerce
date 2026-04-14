import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FashionForge — Premium Fashion Store',
    template: '%s | FashionForge',
  },
  description: 'Discover premium fashion at FashionForge. Shop shirts, pants, dresses, jackets and accessories with style.',
  keywords: ['fashion', 'clothing', 'shirts', 'pants', 'dresses', 'jackets', 'online shopping', 'India'],
  authors: [{ name: 'FashionForge' }],
  creator: 'FashionForge',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://fashionforge.in',
    siteName: 'FashionForge',
    title: 'FashionForge — Premium Fashion Store',
    description: 'Discover premium fashion. Shop shirts, pants, dresses, jackets and accessories.',
  },
  robots: { index: true, follow: true },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <ThemeProvider>
          <Navbar />
          <CartDrawer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
              },
            }}
          />
          {children}
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
