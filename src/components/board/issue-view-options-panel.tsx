"use client";

import { Divider } from "@/components/ui/divider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/components/locale-provider";
import {
  DEFAULT_VIEW_OPTIONS,
  type IssueSortKey,
  type IssueViewOptions,
} from "@/lib/board/issue-view-config";

export { DEFAULT_VIEW_OPTIONS, type IssueSortKey, type IssueViewOptions };

const SORT_KEYS: IssueSortKey[] = ["created", "priority", "title"];

export interface IssueViewOptionsPanelProps {
  options: IssueViewOptions;
  onChange: (options: IssueViewOptions) => void;
}

export function IssueViewOptionsPanel({ options, onChange }: IssueViewOptionsPanelProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>{t("viewOptions.sort.label")}</Label>
        <RadioGroup
          value={options.sortKey}
          onValueChange={(v) => onChange({ ...options, sortKey: v as IssueSortKey })}
          className="flex flex-col gap-2"
        >
          {SORT_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-small text-text-primary">
              <RadioGroupItem value={key} />
              {t(`viewOptions.sort.${key}`)}
            </label>
          ))}
        </RadioGroup>
      </div>

      <Divider />

      <div className="flex flex-col gap-2.5">
        <Label>{t("viewOptions.display.label")}</Label>
        <div className="flex items-center justify-between">
          <span className="text-small text-text-primary">{t("viewOptions.display.priority")}</span>
          <Switch
            checked={options.showPriority}
            onCheckedChange={(v) => onChange({ ...options, showPriority: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-text-primary">{t("viewOptions.display.assignee")}</span>
          <Switch
            checked={options.showAssignee}
            onCheckedChange={(v) => onChange({ ...options, showAssignee: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-text-primary">{t("viewOptions.display.labels")}</span>
          <Switch
            checked={options.showLabels}
            onCheckedChange={(v) => onChange({ ...options, showLabels: v })}
          />
        </div>
      </div>
    </div>
  );
}
