import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNavigation from '@/components/BottomNavigation'
import { AuthProvider } from '@/contexts/AuthContext'
import { EnvValidator } from '@/components/EnvValidator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Magna Coders',
  description: 'The community for builders and developers.',
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/image.svg",
    apple: "/icons/image.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#E50914",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedColor = localStorage.getItem('accentColor');
                if (savedColor) {
                  document.documentElement.style.setProperty('--primary-color', savedColor);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <EnvValidator />
          <div id="root">
            {children}
          </div>
          <BottomNavigation />
        </AuthProvider>
      </body>
    </html>
  )
}