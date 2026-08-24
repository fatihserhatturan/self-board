"use client";

import { Inbox } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function InboxPage() {
  const { t } = useLocale();
  return (
    <>
      <TopBar title={t("nav.inbox")} />
      <EmptyState icon={Inbox} title={t("emptyState.inbox.title")} />
    </>
  );
}
