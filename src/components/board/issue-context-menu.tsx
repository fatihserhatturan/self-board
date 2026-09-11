"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { StatusIcon } from "@/components/ui/status-icon";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { updateIssuePriority, updateIssueStatus } from "@/lib/actions/issues";
import type { BoardIssue } from "@/lib/data/issues";
import { priorityLevels, statusStates } from "@/lib/token-manifest";

export interface IssueContextMenuProps {
  issue: BoardIssue;
  children: ReactNode;
}

/**
 * Liste satırı ve pano kartında sağ tık menüsü. Önceden bir issue'nun durumunu
 * ya da önceliğini değiştirmenin tek yolu detay dialog'unu açıp kaydetmekti
 * (panoda sürükleme dışında); bu, en sık yapılan iki değişikliği tek tıklamaya
 * indiriyor.
 */
export function IssueContextMenu({ issue, children }: IssueContextMenuProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function apply(run: () => Promise<{ ok: boolean }>) {
    const result = await run();
    if (!result.ok) {
      toast.error(t("toast.issue.updateError"));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {statusStates.map((status) => (
          <ContextMenuItem
            key={status}
            onSelect={() => void apply(() => updateIssueStatus(issue.id, status))}
          >
            <StatusIcon state={status} size="sm" />
            <span className="flex-1">{t(`board.status.${status}`)}</span>
            {issue.status === status && <Check className="size-3.5 text-text-tertiary" />}
          </ContextMenuItem>
        ))}

        <ContextMenuSeparator />

        {priorityLevels.map((priority) => (
          <ContextMenuItem
            key={priority}
            onSelect={() => void apply(() => updateIssuePriority(issue.id, priority))}
          >
            <PriorityIcon level={priority} size="sm" />
            <span className="flex-1">{t(`board.priority.${priority}`)}</span>
            {issue.priority === priority && <Check className="size-3.5 text-text-tertiary" />}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
