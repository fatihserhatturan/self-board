"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { exportWorkspace } from "@/lib/actions/backup";
import { todayIsoDate } from "@/lib/board/cycle-status";

export function DataSettings() {
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

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-large font-medium text-text-primary">{t("settings.data.title")}</h2>
      <p className="max-w-xl text-small text-text-secondary">{t("settings.data.exportHint")}</p>
      <Button className="self-start" onClick={handleExport} loading={exporting}>
        <Download className="size-3.5" />
        {t("settings.data.export")}
      </Button>
    </section>
  );
}
