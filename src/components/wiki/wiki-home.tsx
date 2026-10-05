"use client";

import { BookOpen, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { RelativeTime } from "@/components/ui/relative-time";
import { useLocale } from "@/components/locale-provider";
import { pagePath, recentPages, type WikiTreeNode } from "@/lib/modules/wiki/tree";

export interface WikiHomeProps {
  nodes: WikiTreeNode[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  titleOf: (node: WikiTreeNode) => string;
}

/** Sayfa seçili değilken: son düzenlenen sayfalar ya da (hiç sayfa yoksa) ilk sayfaya davet. */
export function WikiHome({ nodes, onOpen, onCreate, titleOf }: WikiHomeProps) {
  const { t } = useLocale();

  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("wiki.empty.title")}
        description={t("wiki.empty.description")}
        action={{ label: t("wiki.empty.action"), onClick: onCreate }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-10 py-8">
      <h2 className="text-small font-medium text-text-primary">{t("wiki.recent.title")}</h2>
      <ul className="flex flex-col divide-y divide-border-default rounded-lg border border-border-default">
        {recentPages(nodes, 8).map((node) => {
          const parents = pagePath(nodes, node.id).slice(0, -1);
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onOpen(node.id)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-bg-muted"
              >
                <FileText className="size-4 shrink-0 text-text-tertiary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-small text-text-primary">
                    {titleOf(node) || t("common.untitled")}
                  </span>
                  {parents.length > 0 && (
                    <span className="truncate text-mini text-text-tertiary">
                      {parents.map((part) => titleOf(part) || t("common.untitled")).join(" / ")}
                    </span>
                  )}
                </span>
                <RelativeTime iso={node.updatedAt} className="shrink-0 text-mini text-text-tertiary" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
