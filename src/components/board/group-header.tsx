"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { StatusIcon } from "@/components/ui/status-icon";
import { useLocale } from "@/components/locale-provider";
import type { IssueGroup } from "@/lib/board/issue-grouping";
import { COLOR_DOT_CLASS } from "@/lib/board/color-tokens";
import type { TranslationKey } from "@/lib/i18n/types";

/**
 * Grup başlığının ikonu ve metni. Pano sütunu ve liste bölümü aynı görseli
 * gösteriyor; gruplama alanı değiştiğinde ikonun ne olacağını tek yer biliyor.
 */
export function GroupHeader({ group }: { group: IssueGroup }) {
  const { t } = useLocale();
  const label = group.labelKind === "translation" ? t(group.label as TranslationKey) : group.label;

  return (
    <>
      {group.state && <StatusIcon state={group.state} size="sm" />}
      {group.priority && <PriorityIcon level={group.priority} size="sm" />}
      {group.assignee && <Avatar name={group.assignee.name} size="sm" />}
      {group.color && (
        <span className={`size-2.5 shrink-0 rounded-full ${COLOR_DOT_CLASS[group.color]}`} />
      )}
      <span className="truncate text-small font-medium text-text-primary">{label}</span>
      <Badge size="sm" color="grey">
        {group.issues.length}
      </Badge>
    </>
  );
}
