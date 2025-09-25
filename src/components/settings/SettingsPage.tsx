"use client";

import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { AccountSection } from "@/components/settings/page/AccountSection";
import { AppearanceSettingsSection } from "@/components/settings/page/AppearanceSettingsSection";
import { FeedbackSection } from "@/components/settings/page/FeedbackSection";
import { GeneralSettingsSection } from "@/components/settings/page/GeneralSettingsSection";
import { ProUpgradeSection } from "@/components/settings/page/ProUpgradeSection";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

interface PreferenceState {
  notifications: boolean;
  autoPlay: boolean;
  subtitleEnabled: boolean;
  shadowingEnabled: boolean;
  showTranslation: boolean;
  fontSize: "small" | "medium" | "large" | string;
  loopCount: number;
  playbackSpeed: number;
  nativeLanguage: string;
  targetLanguage: string;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<PreferenceState>({
    notifications: true,
    autoPlay: true,
    subtitleEnabled: true,
    shadowingEnabled: true,
    showTranslation: true,
    fontSize: "medium",
    loopCount: 3,
    playbackSpeed: 1.0,
    nativeLanguage: "zh",
    targetLanguage: "en",
  });

  const { theme, setTheme, resolvedTheme } = useTheme();
  const activeTheme = useMemo(
    () => (theme === "system" ? resolvedTheme : theme),
    [theme, resolvedTheme],
  );

  const updatePreferences = (updates: Partial<PreferenceState>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <AccountSection />
        <ProUpgradeSection />
        <GeneralSettingsSection
          fontSize={preferences.fontSize}
          loopCount={preferences.loopCount}
          showTranslation={preferences.showTranslation}
          onFontSizeChange={(size) => updatePreferences({ fontSize: size })}
          onLoopCountChange={(count) => updatePreferences({ loopCount: count })}
          onToggleTranslation={(checked) => updatePreferences({ showTranslation: checked })}
        />
        <AppearanceSettingsSection
          activeTheme={activeTheme}
          themeSetting={theme}
          onThemeChange={(newTheme) => setTheme(newTheme)}
        />
        <FeedbackSection />
      </div>
    </SettingsLayout>
  );
}
