import './globals.css'
import type { Metadata } from 'next'

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
      <body>{children}</body>
    </html>
  )
}
