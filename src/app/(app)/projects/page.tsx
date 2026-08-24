"use client";

import { FolderKanban } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function ProjectsPage() {
  const { t } = useLocale();
  return (
    <>
      <TopBar title={t("nav.projects")} viewSwitcher primaryActionLabel={t("page.projects.newAction")} />
      <EmptyState icon={FolderKanban} title={t("emptyState.projects.title")} />
    </>
  );
}
