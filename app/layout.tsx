import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://collect.adamliu.uk'),
  title: '請款 · Collect',
  description: 'Simple, quiet payment requests.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F2EDE4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700&family=Zen+Kaku+Gothic+New:wght@300;400&family=DM+Mono:ital,wght@0,300;0,400;1,300&family=Pinyon+Script&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
