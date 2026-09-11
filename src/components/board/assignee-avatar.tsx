"use client";

import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import type { Person } from "@/lib/data/issues";

export interface AssigneeAvatarProps {
  assignee?: Person;
}

/**
 * Atanan avatarı ya da kesikli çerçeveli "atanmamış" rozeti. Issue kartı ve
 * liste satırı bu bloğu birebir kopyalıyordu.
 */
export function AssigneeAvatar({ assignee }: AssigneeAvatarProps) {
  const { t } = useLocale();

  if (assignee) {
    return (
      <Tooltip content={assignee.name}>
        <span className="flex">
          <Avatar name={assignee.name} size="sm" />
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={t("board.issueCard.unassigned.label")}>
      <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border-default text-micro text-text-tertiary">
        ?
      </span>
    </Tooltip>
  );
}
