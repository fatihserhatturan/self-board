"use client";

import { RotateCw } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

export function TeamCyclesContent() {
  const { t } = useLocale();
  return (
    <>
      <TopBar
        title={t("nav.cycles")}
        breadcrumb={DEFAULT_TEAM.name}
        primaryActionLabel={t("page.cycles.newAction")}
      />
      <EmptyState icon={RotateCw} title={t("emptyState.cycles.title")} />
    </>
  );
}
