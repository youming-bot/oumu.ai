import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PageErrorBoundary } from '@/components/error-boundary';
import PwaRegister from '@/components/pwa-register';
import { AppProvider } from '@/contexts/app-context';

export const metadata: Metadata = {
  title: 'Shadowing Learning',
  description: 'Web-based language shadowing learning application',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shadowing Learning',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shadowing Learning" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <PageErrorBoundary>
          <AppProvider>{children}</AppProvider>
        </PageErrorBoundary>
        <PwaRegister />
      </body>
    </html>
  );
}
