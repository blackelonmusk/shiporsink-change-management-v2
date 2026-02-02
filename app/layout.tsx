import './globals.css'
import type { Metadata, Viewport } from 'next'
import Footer from '@/components/Footer'
import ToastProvider from '@/components/ToastProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import QueryProvider from '@/components/QueryProvider'
import Script from 'next/script'
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: 'Change - AI Change Management Assistant | Free ADKAR Coaching',
  description: 'Free AI-powered change management coaching. Track stakeholders, get ADKAR guidance, prepare for difficult conversations, and manage organizational change like a Prosci-certified pro.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  metadataBase: new URL('https://change.shiporsink.ai'),
  alternates: {
    canonical: '/',
  },
  keywords: ['change management', 'ADKAR', 'stakeholder management', 'organizational change', 'Prosci', 'AI coaching', 'change management tool'],
  authors: [{ name: 'Ship or Sink', url: 'https://shiporsink.ai' }],
  creator: 'Ship or Sink',
  publisher: 'Ship or Sink',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://change.shiporsink.ai',
    siteName: 'Change by Ship or Sink',
    title: 'Change - AI Change Management Assistant',
    description: 'Free AI-powered change management coaching. Track stakeholders, get ADKAR guidance, and manage organizational change like a pro.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Change - AI Change Management Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Change - AI Change Management Assistant',
    description: 'Free AI-powered change management coaching. Track stakeholders, get ADKAR guidance, and manage organizational change like a pro.',
    images: ['/og-image.png'],
    creator: '@shiporsink',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
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
        <Analytics />
      </body>
    </html>
  )
}
