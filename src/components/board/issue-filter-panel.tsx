"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";
import { useLocale } from "@/components/locale-provider";
import type { IssueLabel, Person } from "@/lib/data/issues";
import { priorityLevels, statusStates } from "@/lib/token-manifest";
import { EMPTY_FILTER_CRITERIA, type IssueFilterCriteria } from "@/lib/board/issue-view-config";

export { EMPTY_FILTER_CRITERIA, type IssueFilterCriteria };

const UNASSIGNED = "unassigned";

export interface IssueFilterPanelProps {
  criteria: IssueFilterCriteria;
  onChange: (criteria: IssueFilterCriteria) => void;
  onClear: () => void;
  users: Person[];
  labels: IssueLabel[];
}

export function IssueFilterPanel({
  criteria,
  onChange,
  onClear,
  users,
  labels,
}: IssueFilterPanelProps) {
  const { t } = useLocale();

  const statusOptions = statusStates.map((status) => ({
    value: status,
    label: t(`board.status.${status}`),
  }));
  const priorityOptions = priorityLevels.map((priority) => ({
    value: priority,
    label: t(`board.priority.${priority}`),
  }));
  const assigneeOptions = [
    { value: UNASSIGNED, label: t("board.issueCard.unassigned.label") },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];
  const labelOptions = labels.map((label) => ({ value: label.id, label: label.name }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.status.label")}</Label>
        <MultiSelect
          options={statusOptions}
          value={criteria.statuses}
          onValueChange={(v) => onChange({ ...criteria, statuses: v as StatusState[] })}
          placeholder={t("filter.status.placeholder")}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.priority.label")}</Label>
        <MultiSelect
          options={priorityOptions}
          value={criteria.priorities}
          onValueChange={(v) => onChange({ ...criteria, priorities: v as PriorityLevel[] })}
          placeholder={t("filter.priority.placeholder")}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.assignee.label")}</Label>
        <MultiSelect
          options={assigneeOptions}
          value={criteria.assigneeIds}
          onValueChange={(v) => onChange({ ...criteria, assigneeIds: v })}
          placeholder={t("filter.assignee.placeholder")}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.labels.label")}</Label>
        <MultiSelect
          options={labelOptions}
          value={criteria.labelIds}
          onValueChange={(v) => onChange({ ...criteria, labelIds: v })}
          placeholder={t("issueForm.labels.placeholder")}
          className="w-full"
        />
      </div>

      <Button variant="ghost" size="sm" onClick={onClear} className="self-start">
        {t("filter.clearAll")}
      </Button>
    </div>
  );
}
