import './globals.css'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import ToastProvider from '@/components/ToastProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Ship or Sink - Change Management',
  description: 'AI-powered change management assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-gray-900 dark:bg-gray-900 light:bg-gray-100 transition-colors">
        <ThemeProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
