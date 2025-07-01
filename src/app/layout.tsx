import * as React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SRVIC',
  description: 'San Ramon Valley Islamic Center',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#047857'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    // Request periodic background sync
                    if ('periodicSync' in registration) {
                      registration.periodicSync.register('update-data', {
                        minInterval: 5 * 60 * 1000 // 5 minutes
                      }).catch(console.error);
                    }
                  }).catch(console.error);
                });

                // Listen for updates from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data.type === 'CONTENT_UPDATED') {
                    window.location.reload();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
