"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

interface NavigationProps {
  currentView?: "files" | "settings";
  onViewChange?: (view: "files" | "settings") => void;
}

export default function Navigation({ currentView = "files", onViewChange }: NavigationProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const themeIcon = useMemo(
    () => (resolvedTheme === "dark" ? "light_mode" : "dark_mode"),
    [resolvedTheme],
  );

  const themeLabel = useMemo(
    () => (resolvedTheme === "dark" ? "切换至浅色主题" : "切换至暗色主题"),
    [resolvedTheme],
  );

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // 确保在客户端才渲染主题相关内容
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      id: "files",
      label: "文件",
      icon: "folder",
      active: currentView === "files",
    },
    {
      id: "settings",
      label: "设置",
      icon: "settings",
      active: currentView === "settings",
    },
    {
      id: "theme",
      label: themeLabel,
      icon: themeIcon,
      active: false,
      onClick: toggleTheme,
    },
  ];

  const handleNavClick = (item: { onClick?: () => void; id: string }) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.id === "files" || item.id === "settings") {
      onViewChange?.(item.id);
    }
  };

  if (!mounted) {
    return (
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 rounded-full bg-surface/90 backdrop-blur-sm p-1.5 shadow-lg border-2 border-border/80">
          {navItems.map((item) => (
            <div key={item.id} className="flex h-11 w-11 items-center justify-center rounded-full">
              <div className="h-6 w-6" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 rounded-full bg-surface/90 backdrop-blur-sm p-1.5 shadow-lg border-2 border-border/80">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-primary/80 hover:bg-primary/10 transition-colors ${
              item.active ? "bg-primary/10" : ""
            }`}
            title={item.label}
            aria-label={item.label}
            aria-pressed={item.active}
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
