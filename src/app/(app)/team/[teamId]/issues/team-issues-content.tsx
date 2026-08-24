"use client";

import { useState } from "react";
import { ListTodo } from "lucide-react";
import { Board } from "@/components/board/board";
import { TopBar, type TopBarView } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import type { BoardIssue } from "@/lib/data/issues";

export interface TeamIssuesContentProps {
  issues: BoardIssue[];
}

export function TeamIssuesContent({ issues }: TeamIssuesContentProps) {
  const { t } = useLocale();
  const [view, setView] = useState<TopBarView>("list");

  return (
    <>
      <TopBar
        title={t("nav.issues")}
        breadcrumb={DEFAULT_TEAM.name}
        view={view}
        onViewChange={setView}
        primaryActionLabel={t("common.newIssue")}
      />
      {view === "board" ? (
        <Board issues={issues} />
      ) : (
        <EmptyState
          icon={ListTodo}
          title={t("board.listView.placeholder.title")}
          description={t("board.listView.placeholder.description")}
        />
      )}
    </>
  );
}
