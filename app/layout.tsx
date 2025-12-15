import './globals.css'
import type { Metadata, Viewport } from 'next'
import Footer from '@/components/Footer'
import ToastProvider from '@/components/ToastProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import QueryProvider from '@/components/QueryProvider'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Change - AI Change Management',
  description: 'AI-powered change management coaching',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-gray-900 overflow-x-hidden w-full">
        <QueryProvider>
          <ThemeProvider>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
            <ToastProvider />
          </ThemeProvider>
        </QueryProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }`}
        </Script>
      </body>
    </html>
  )
}
