"use client";

import { RotateCw } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export function CyclesContent() {
  const { t } = useLocale();
  return (
    <>
      <TopBar
        title={t("nav.cycles")}
        primaryActionLabel={t("page.cycles.newAction")}
        primaryActionDisabled
      />
      <EmptyState icon={RotateCw} title={t("emptyState.cycles.title")} />
    </>
  );
}
