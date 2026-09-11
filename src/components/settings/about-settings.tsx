"use client";

import { useLocale } from "@/components/locale-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";

export interface AboutSettingsProps {
  version: string;
  platform: string;
  nodeVersion: string;
  databasePath: string;
}

export function AboutSettings({
  version,
  platform,
  nodeVersion,
  databasePath,
}: AboutSettingsProps) {
  const { t } = useLocale();

  const rows: { label: string; value: string; wrap?: boolean }[] = [
    { label: t("settings.about.version"), value: version },
    { label: t("settings.about.platform"), value: platform },
    { label: t("settings.about.runtime"), value: nodeVersion },
    { label: t("settings.about.database"), value: databasePath, wrap: true },
  ];

  return (
    <SettingsPage title={t("settings.about.title")} description={t("settings.about.description")}>
      <SettingsSection>
        {rows.map((row) => (
          <SettingsRow
            key={row.label}
            label={row.label}
            stacked={row.wrap}
            control={
              <span
                className={
                  row.wrap
                    ? "block break-all font-mono text-mini text-text-secondary"
                    : "block text-right font-mono text-mini text-text-secondary"
                }
              >
                {row.value}
              </span>
            }
          />
        ))}
      </SettingsSection>
    </SettingsPage>
  );
}
