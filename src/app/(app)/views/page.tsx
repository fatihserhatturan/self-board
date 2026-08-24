"use client";

import { Layers } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function ViewsPage() {
  const { t } = useLocale();
  return (
    <>
      <TopBar title={t("nav.views")} />
      <EmptyState icon={Layers} title={t("emptyState.views.title")} />
    </>
  );
}
