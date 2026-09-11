"use client";

import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <EmptyState
      icon={FileQuestion}
      title={t("notFound.title")}
      description={t("notFound.description")}
      action={{ label: t("error.backHome"), href: "/my-issues" }}
    />
  );
}
