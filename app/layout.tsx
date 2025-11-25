import './globals.css'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

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
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-900">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
