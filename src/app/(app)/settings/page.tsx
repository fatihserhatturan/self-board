"use client";

import { Settings } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function SettingsPage() {
  const { t } = useLocale();
  return (
    <>
      <TopBar title={t("common.settings")} />
      <EmptyState icon={Settings} title={t("emptyState.settings.title")} />
    </>
  );
}
