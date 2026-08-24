"use client";

import { ListTodo } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function MyIssuesPage() {
  const { t } = useLocale();
  return (
    <>
      <TopBar title={t("nav.myIssues")} primaryActionLabel={t("common.newIssue")} />
      <EmptyState
        icon={ListTodo}
        title={t("emptyState.issues.title")}
        action={{ label: t("emptyState.issues.action") }}
      />
    </>
  );
}
