"use client";

import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/components/locale-provider";
import { RichTextEditor } from "@/components/board/rich-text-editor";
import type { IssueFormValues } from "@/lib/actions/issues";
import type { IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";
import { cycleLabel } from "@/lib/board/cycle-label";
import { priorityLevels } from "@/lib/token-manifest";
import type { WorkflowState } from "@/lib/board/workflow-config";
import { StatusIcon } from "@/components/ui/status-icon";

const UNASSIGNED = "unassigned";
const NO_CYCLE = "no-cycle";

export interface IssueDialogFormProps {
  values: IssueFormValues;
  onChange: (values: IssueFormValues) => void;
  users: Person[];
  labels: IssueLabel[];
  cycles: Cycle[];
  states: WorkflowState[];
  titleError?: string;
}

export function IssueDialogForm({
  values,
  onChange,
  users,
  labels,
  cycles,
  states,
  titleError,
}: IssueDialogFormProps) {
  const { t } = useLocale();

  function update<K extends keyof IssueFormValues>(key: K, value: IssueFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const assigneeOptions = [
    { value: UNASSIGNED, label: t("board.issueCard.unassigned.label") },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];

  const labelOptions = labels.map((label) => ({ value: label.id, label: label.name }));

  const cycleOptions = [
    { value: NO_CYCLE, label: t("board.cycle.none.label") },
    ...cycles.map((cycle) => ({ value: cycle.id, label: cycleLabel(cycle) })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="issue-title">{t("issueForm.title.label")}</Label>
        <Input
          id="issue-title"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={t("issueForm.title.placeholder")}
          invalid={Boolean(titleError)}
        />
        {titleError && <span className="text-mini text-destructive">{titleError}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.description.label")}</Label>
        <RichTextEditor
          content={values.description}
          onChange={(v) => update("description", v)}
          placeholder={t("issueForm.description.placeholder")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("issueForm.status.label")}</Label>
          <Select value={values.stateId} onValueChange={(v) => update("stateId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  <span className="flex items-center gap-2">
                    <StatusIcon state={state} size="sm" />
                    {state.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("issueForm.priority.label")}</Label>
          <Select
            value={values.priority}
            onValueChange={(v) => update("priority", v as IssueFormValues["priority"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityLevels.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {t(`board.priority.${priority}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("issueForm.assignee.label")}</Label>
          <Combobox
            options={assigneeOptions}
            value={values.assigneeId ?? UNASSIGNED}
            onValueChange={(v) => update("assigneeId", v === UNASSIGNED ? null : v)}
            placeholder={t("issueForm.assignee.placeholder")}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("issueForm.labels.label")}</Label>
          <MultiSelect
            options={labelOptions}
            value={values.labelIds}
            onValueChange={(v) => update("labelIds", v)}
            placeholder={t("issueForm.labels.placeholder")}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("issueForm.cycle.label")}</Label>
        <Combobox
          options={cycleOptions}
          value={values.cycleId ?? NO_CYCLE}
          onValueChange={(v) => update("cycleId", v === NO_CYCLE ? null : v)}
          placeholder={t("issueForm.cycle.placeholder")}
          className="w-full"
        />
      </div>
    </div>
  );
}
