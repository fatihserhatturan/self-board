"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { exportWorkspace } from "@/lib/actions/backup";
import { todayIsoDate } from "@/lib/board/cycle-status";
import type { WorkspaceStats } from "@/lib/data/stats";

export interface DataSettingsProps {
  stats: WorkspaceStats;
}

/** Bayt değerini okunur birime çevirir. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function DataSettings({ stats }: DataSettingsProps) {
  const { t } = useLocale();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const result = await exportWorkspace();
    setExporting(false);
    if (!result.ok) {
      toast.error(t("settings.data.exportError"));
      return;
    }

    const url = URL.createObjectURL(new Blob([result.data.json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `self-board-${todayIsoDate()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    // İndirme başlamadan revoke edilirse dosya boş kalabiliyor — bir tur bekleniyor.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const rows: { label: string; value: string }[] = [
    { label: t("settings.data.stats.projects"), value: String(stats.projects) },
    { label: t("settings.data.stats.issues"), value: String(stats.issues) },
    { label: t("settings.data.stats.notes"), value: String(stats.notes) },
    { label: t("settings.data.stats.attachments"), value: String(stats.attachments) },
    {
      label: t("settings.data.stats.attachmentSize"),
      value: formatBytes(stats.attachmentBytes),
    },
  ];

  return (
    <SettingsPage title={t("settings.data.title")} description={t("settings.data.description")}>
      <SettingsSection title={t("settings.data.stats.title")}>
        {rows.map((row) => (
          <SettingsRow
            key={row.label}
            label={row.label}
            control={
              <span className="block text-right text-small text-text-primary [font-variant-numeric:tabular-nums]">
                {row.value}
              </span>
            }
          />
        ))}
      </SettingsSection>

      <SettingsSection title={t("settings.data.export")}>
        <SettingsRow
          label={t("settings.data.export")}
          description={t("settings.data.exportHint")}
          stacked
          control={
            <Button className="self-start" onClick={handleExport} loading={exporting}>
              <Download className="size-3.5" />
              {t("settings.data.export")}
            </Button>
          }
        />
      </SettingsSection>
    </SettingsPage>
  );
}
