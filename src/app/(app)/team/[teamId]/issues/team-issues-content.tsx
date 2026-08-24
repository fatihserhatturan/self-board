"use client";

import { ListTodo } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

export function TeamIssuesContent() {
  const { t } = useLocale();
  return (
    <>
      <TopBar
        title={t("nav.issues")}
        breadcrumb={DEFAULT_TEAM.name}
        viewSwitcher
        primaryActionLabel={t("common.newIssue")}
      />
      <EmptyState icon={ListTodo} title={t("emptyState.issues.title")} />
    </>
  );
}
