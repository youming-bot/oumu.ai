import {
  SettingsCard,
  SettingsRow,
  SettingsRowContent,
  SettingsSection,
} from "@/components/settings/SettingsCard";

interface AppearanceSettingsSectionProps {
  activeTheme?: string | null;
  themeSetting?: string | null;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function AppearanceSettingsSection({
  activeTheme = "light",
  themeSetting = "system",
  onThemeChange,
}: AppearanceSettingsSectionProps) {
  const isSystem = themeSetting === "system";

  return (
    <SettingsSection title="外观">
      <SettingsCard>
        <SettingsRow>
          <SettingsRowContent title="主题模式" description="跟随系统或手动选择亮/暗模式" />
          <div className="settings-button-group">
            <button
              className={`settings-button ${activeTheme === "light" ? "active" : ""}`}
              type="button"
              onClick={() => onThemeChange("light")}
              aria-pressed={activeTheme === "light"}
            >
              浅色
            </button>
            <button
              className={`settings-button ${activeTheme === "dark" ? "active" : ""}`}
              type="button"
              onClick={() => onThemeChange("dark")}
              aria-pressed={activeTheme === "dark"}
            >
              暗色
            </button>
            <button
              className={`settings-button ${isSystem ? "active" : ""}`}
              type="button"
              onClick={() => onThemeChange("system")}
              aria-pressed={isSystem}
            >
              系统
            </button>
          </div>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  );
}
