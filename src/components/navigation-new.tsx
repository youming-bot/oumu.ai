"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface NavigationProps {
  currentView?: "files" | "settings";
  onViewChange?: (view: "files" | "settings") => void;
}

export default function Navigation({ currentView = "files", onViewChange }: NavigationProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 确保在客户端才渲染主题相关内容
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      id: "files",
      label: "首页",
      icon: "home",
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
      label: "主题",
      icon: "dark_mode",
      active: false,
      onClick: () => {
        if (mounted) {
          setTheme(theme === "dark" ? "light" : "dark");
        }
      },
    },
  ];

  const handleNavClick = (item: { onClick?: () => void; id: string; }) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.id === "files" || item.id === "settings") {
      onViewChange?.(item.id);
    }
  };

  if (!mounted) {
    return (
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-container">
          {navItems.map((item) => (
            <div key={item.id} className="nav-button">
              <div className="h-6 w-6" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item)}
            className={`nav-button ${item.active ? "active" : ""}`}
            title={item.label}
          >
              <span className="material-symbols-outlined text-3xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
