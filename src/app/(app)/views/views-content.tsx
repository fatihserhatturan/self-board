"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Trash2 } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRenameInput } from "@/components/ui/inline-rename-input";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { deleteView, renameView } from "@/lib/actions/views";
import type { SavedView } from "@/lib/data/views";
import { countActiveFilters } from "@/lib/board/filter-summary";

export interface ViewsContentProps {
  projectId: string;
  projectName: string;
  views: SavedView[];
}

export function ViewsContent({ projectId, projectName, views: initialViews }: ViewsContentProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [views, setViews] = useState(initialViews);
  const [pendingDelete, setPendingDelete] = useState<SavedView | null>(null);

  async function handleRename(view: SavedView, name: string) {
    if (!name.trim() || name === view.name) return;
    setViews((prev) => prev.map((v) => (v.id === view.id ? { ...v, name } : v)));
    const result = await renameView(view.id, name);
    if (!result.ok) {
      setViews((prev) => prev.map((v) => (v.id === view.id ? view : v)));
      toast.error(t("views.renameError"));
    }
  }

  async function handleDelete(view: SavedView) {
    setPendingDelete(null);
    const previous = views;
    setViews((prev) => prev.filter((v) => v.id !== view.id));
    const result = await deleteView(view.id);
    if (!result.ok) {
      setViews(previous);
      toast.error(t("views.deleteError"));
    }
  }

  return (
    <>
      <TopBar
        title={t("nav.views")}
        breadcrumb={projectName}
        primaryActionLabel={t("page.views.newAction")}
        onPrimaryAction={() => router.push(`/issues?project=${projectId}`)}
      />

      {views.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("emptyState.views.title")}
          action={{
            label: t("page.views.newAction"),
            onClick: () => router.push(`/issues?project=${projectId}`),
          }}
        />
      ) : (
        <div className="flex flex-col gap-2 p-4">
          {views.map((view) => {
            const filterCount = countActiveFilters(view.filters);
            return (
              <div
                key={view.id}
                className="flex items-center gap-2 rounded-lg border border-border-default p-3"
              >
                <InlineRenameInput
                  className="flex-1"
                  value={view.name}
                  ariaLabel={t("views.saveDialog.namePlaceholder")}
                  onRename={(next) => handleRename(view, next)}
                />
                <Badge size="sm" color="grey">
                  {t(view.layout === "board" ? "topbar.tab.board" : "topbar.tab.list")}
                </Badge>
                <span className="text-mini text-text-tertiary">
                  {filterCount} {t("views.card.filterCount")}
                </span>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/issues?project=${projectId}&view=${view.id}`}>
                    {t("views.card.openAction")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("views.card.deleteAction")}
                  onClick={() => setPendingDelete(view)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={t("confirm.deleteView.title")}
        description={t("confirm.deleteView.description")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete);
        }}
      />
    </>
  );
}
