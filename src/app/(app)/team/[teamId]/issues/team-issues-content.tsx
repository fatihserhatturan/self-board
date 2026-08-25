"use client";

import { useState } from "react";
import { Board } from "@/components/board/board";
import { IssueList } from "@/components/board/issue-list";
import { TopBar, type TopBarView } from "@/components/app-shell/top-bar";
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
      {view === "board" ? <Board issues={issues} /> : <IssueList issues={issues} />}
    </>
  );
}
