"use client";

import { Layers } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

export function TeamViewsContent() {
  const { t } = useLocale();
  return (
    <>
      <TopBar title={t("nav.views")} breadcrumb={DEFAULT_TEAM.name} />
      <EmptyState icon={Layers} title={t("emptyState.views.title")} />
    </>
  );
}
