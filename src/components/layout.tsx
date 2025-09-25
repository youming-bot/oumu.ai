"use client";

import { FileText, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

interface LayoutProps {
  children: ReactNode;
  currentView?: "files" | "settings";
  onViewChange?: (view: "files" | "settings") => void;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 使用useEffect确保只在客户端渲染主题图标
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <div className="h-4 w-4" />
        <span className="sr-only">切换主题</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 transition-colors hover:bg-green-600/10 dark:hover:bg-green-400/10"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <Moon className="h-4 w-4 text-green-600 dark:text-green-400" />
      )}
      <span className="sr-only">切换主题</span>
    </Button>
  );
}

export default function Layout({ children, currentView = "files", onViewChange }: LayoutProps) {
  const navigation = [
    { id: "files", label: "文件", icon: FileText },
    { id: "settings", label: "设置", icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="-translate-x-1/2 fixed top-6 left-1/2 z-40 transform">
        <div className="rounded-full bg-glass px-6 py-3">
          <div className="flex items-center space-x-6">
            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewChange?.(item.id as "files" | "settings")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 ${
                      isActive
                        ? "bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 dark:text-green-400" />
                  </Button>
                );
              })}
              {/* Theme Toggle */}
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 pt-24">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
