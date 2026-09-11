"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/types";
import { useMounted } from "@/lib/use-mounted";

export function AppearanceSettings() {
  const { locale, setLocale, t } = useLocale();
  // `theme` seçilen değer ("system" dahil), `resolvedTheme` ise onun çözülmüş
  // hâli — seçicide seçimin kendisi gösterilmeli.
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-large font-medium text-text-primary">{t("settings.appearance.title")}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("settings.appearance.language.label")}</Label>
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("settings.appearance.theme.label")}</Label>
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
        </div>
      </div>
    </section>
  );
}
