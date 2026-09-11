"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { usePreferences } from "@/components/preferences-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { updatePreferences } from "@/lib/actions/preferences";
import { DATE_FORMATS, type DateFormat } from "@/lib/preferences-config";
import type { Locale } from "@/lib/i18n/types";
import { useMounted } from "@/lib/use-mounted";

export function AppearanceSettings() {
  const { locale, setLocale, t } = useLocale();
  // `theme` seçilen değer ("system" dahil), `resolvedTheme` ise onun çözülmüş
  // hâli — seçicide seçimin kendisi gösterilmeli.
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const router = useRouter();
  const { dateFormat } = usePreferences();
  const [saving, setSaving] = useState(false);

  async function handleDateFormat(next: string) {
    setSaving(true);
    const result = await updatePreferences({ dateFormat: next as DateFormat });
    setSaving(false);
    if (!result.ok) {
      toast.error(t("settings.preferences.saveError"));
      return;
    }
    router.refresh();
  }

  return (
    <SettingsPage
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <SettingsSection>
        <SettingsRow
          label={t("settings.appearance.theme.label")}
          description={t("settings.appearance.theme.description")}
          control={
            <Select value={mounted ? (theme ?? "dark") : "dark"} onValueChange={(v) => setTheme(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("settings.appearance.theme.light")}</SelectItem>
                <SelectItem value="dark">{t("settings.appearance.theme.dark")}</SelectItem>
                <SelectItem value="system">{t("settings.appearance.theme.system")}</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingsRow
          label={t("settings.appearance.language.label")}
          description={t("settings.appearance.language.description")}
          control={
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingsRow
          label={t("settings.appearance.dateFormat.label")}
          description={t("settings.appearance.dateFormat.description")}
          control={
            <Select value={dateFormat} onValueChange={handleDateFormat} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {t(`settings.appearance.dateFormat.${format}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingsSection>
    </SettingsPage>
  );
}
