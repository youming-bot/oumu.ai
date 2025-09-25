"use client";

import { useTheme } from "next-themes";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoPlay: true,
    subtitleEnabled: true,
    shadowingEnabled: true,
    showTranslation: true,
    fontSize: 16,
    playbackSpeed: 1.0,
    language: "auto",
  });

  const { theme, setTheme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="settings-page">
      <section className="space-y-3">
        <h2 className="settings-section-title">外观</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">主题</p>
              <p className="settings-row-description">跟随系统或手动选择亮/暗模式</p>
            </div>
            <div className="settings-pill-group">
              {[
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
              ].map((option) => {
                const isActive = option.id === activeTheme || (!activeTheme && option.id === "light");

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cn("settings-pill", isActive && "active")}
                    onClick={() => setTheme(option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="settings-section-title">通用</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">语言</p>
              <p className="settings-row-description">界面与字幕推荐语言</p>
            </div>
            <div className="settings-inline-controls">
              <select
                value={settings.language}
                onChange={(event) => setSettings({ ...settings, language: event.target.value })}
                className="rounded-xl border border-[var(--settings-divider-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-color)] shadow-sm focus:outline-none"
              >
                <option value="auto">自动检测</option>
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">通知</p>
              <p className="settings-row-description">开启每日练习提醒</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
              className="data-[state=checked]:bg-[var(--player-accent-color)]"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="settings-section-title">学习</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">自动播放</p>
              <p className="settings-row-description">挑选文件后立即进入影子跟读</p>
            </div>
            <Switch
              checked={settings.autoPlay}
              onCheckedChange={(checked) => setSettings({ ...settings, autoPlay: checked })}
              className="data-[state=checked]:bg-[var(--player-accent-color)]"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">跟读循环</p>
              <p className="settings-row-description">自动重复当前语句，便于模仿</p>
            </div>
            <Switch
              checked={settings.shadowingEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, shadowingEnabled: checked })}
              className="data-[state=checked]:bg-[var(--player-accent-color)]"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">播放速度</p>
              <p className="settings-row-description">针对不同难度选择合适的速率</p>
            </div>
            <div className="settings-inline-controls">
              <select
                value={settings.playbackSpeed.toString()}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    playbackSpeed: parseFloat(event.target.value),
                  })
                }
                className="rounded-xl border border-[var(--settings-divider-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-color)] shadow-sm focus:outline-none"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1.0">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2.0">2.0x</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="settings-section-title">显示</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">显示字幕</p>
              <p className="settings-row-description">始终呈现当前句的原文内容</p>
            </div>
            <Switch
              checked={settings.subtitleEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, subtitleEnabled: checked })}
              className="data-[state=checked]:bg-[var(--player-accent-color)]"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">显示翻译</p>
              <p className="settings-row-description">在字幕下显示辅助理解的译文</p>
            </div>
            <Switch
              checked={settings.showTranslation}
              onCheckedChange={(checked) => setSettings({ ...settings, showTranslation: checked })}
              className="data-[state=checked]:bg-[var(--player-accent-color)]"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-content">
              <p className="settings-row-title">字幕字号</p>
              <p className="settings-row-description">按个人喜好调整可读性</p>
            </div>
            <div className="settings-inline-controls">
              <input
                type="range"
                min={12}
                max={24}
                value={settings.fontSize}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    fontSize: parseInt(event.target.value, 10),
                  })
                }
                className="w-32 accent-[var(--player-accent-color)]"
              />
              <span className="settings-value">{settings.fontSize}px</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
