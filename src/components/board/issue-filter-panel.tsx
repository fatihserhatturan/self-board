"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import { useLocale } from "@/components/locale-provider";
import type { IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";
import { priorityLevels } from "@/lib/token-manifest";
import type { WorkflowState } from "@/lib/board/workflow-config";
import { EMPTY_FILTER_CRITERIA, type IssueFilterCriteria } from "@/lib/board/issue-view-config";
import { cycleLabel } from "@/lib/board/cycle-label";

export { EMPTY_FILTER_CRITERIA, type IssueFilterCriteria };

const UNASSIGNED = "unassigned";

export interface IssueFilterPanelProps {
  criteria: IssueFilterCriteria;
  onChange: (criteria: IssueFilterCriteria) => void;
  onClear: () => void;
  users: Person[];
  labels: IssueLabel[];
  cycles: Cycle[];
  states: WorkflowState[];
}

export function IssueFilterPanel({
  criteria,
  onChange,
  onClear,
  users,
  labels,
  cycles,
  states,
}: IssueFilterPanelProps) {
  const { t } = useLocale();

  const stateOptions = states.map((state) => ({ value: state.id, label: state.name }));
  const priorityOptions = priorityLevels.map((priority) => ({
    value: priority,
    label: t(`board.priority.${priority}`),
  }));
  const assigneeOptions = [
    { value: UNASSIGNED, label: t("board.issueCard.unassigned.label") },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];
  const labelOptions = labels.map((label) => ({ value: label.id, label: label.name }));
  const cycleOptions = cycles.map((cycle) => ({ value: cycle.id, label: cycleLabel(cycle) }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.status.label")}</Label>
        <MultiSelect
          options={stateOptions}
          value={criteria.stateIds}
          onValueChange={(v) => onChange({ ...criteria, stateIds: v })}
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

      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.cycle.label")}</Label>
        <MultiSelect
          options={cycleOptions}
          value={criteria.cycleIds}
          onValueChange={(v) => onChange({ ...criteria, cycleIds: v })}
          placeholder={t("filter.cycle.placeholder")}
          className="w-full"
        />
      </div>

      <Button variant="ghost" size="sm" onClick={onClear} className="self-start">
        {t("filter.clearAll")}
      </Button>
    </div>
  );
}
