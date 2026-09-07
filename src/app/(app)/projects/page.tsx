"use client";

import { useState } from "react";
import { FolderKanban } from "lucide-react";
import { TopBar, type TopBarView } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function ProjectsPage() {
  const { t } = useLocale();
  const [view, setView] = useState<TopBarView>("list");
  return (
    <>
      <TopBar
        title={t("nav.projects")}
        view={view}
        onViewChange={setView}
        primaryActionLabel={t("page.projects.newAction")}
        primaryActionDisabled
      />
      <EmptyState icon={FolderKanban} title={t("emptyState.projects.title")} />
    </>
  );
}
