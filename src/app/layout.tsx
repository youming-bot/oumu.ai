import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { PageErrorBoundary } from "@/components/error-boundary";
import { ToastContainer } from "@/components/error-toast";
import { MonitoringInitializer } from "@/components/monitoring-initializer";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "影子跟读",
  description: "Web-based language shadowing learning application",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "影子跟读",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="影子跟读" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* SEO和访问性优化 */}
        <meta
          name="description"
          content="基于Web的语言影子跟读学习应用，支持音频转录、文本处理和跟读练习"
        />
        <meta name="keywords" content="语言学习,影子跟读,音频转录,在线学习" />
        <meta name="author" content="影子跟读团队" />
        <meta name="robots" content="index, follow" />

        {/* PWA主题色 */}
        <meta name="theme-color" content="#3b82f6" />

        {/* 防止Fouc（Flash of Unstyled Content） */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />

        {/* Material Icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <MonitoringInitializer />
        <PageErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative min-h-screen">{children}</div>
          </ThemeProvider>
        </PageErrorBoundary>
        <PwaRegister />
        <ToastContainer>{null}</ToastContainer>
      </body>
    </html>
  );
}
