import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Collect | Portal',
  description: 'Manage your payment requests.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
