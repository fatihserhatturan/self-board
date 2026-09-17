"use client";

import { useState } from "react";
import { useSyncedState } from "@/lib/use-synced-state";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColorSelect } from "@/components/ui/color-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineRenameInput } from "@/components/ui/inline-rename-input";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import {
  SettingsPage,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { createLabel, deleteLabel, updateLabel, type LabelColor } from "@/lib/actions/labels";
import type { IssueLabel } from "@/lib/data/issues";

export interface LabelSettingsProps {
  labels: IssueLabel[];
  /** Etiket id'si -> kaç issue'da kullanıldığı. */
  usage: Record<string, number>;
}

export function LabelSettings({ labels: initialLabels, usage }: LabelSettingsProps) {
  const { t } = useLocale();
  const [labels, setLabels] = useSyncedState(initialLabels);
  const [pendingDelete, setPendingDelete] = useState<IssueLabel | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("grey");
  const [creating, setCreating] = useState(false);

  async function handleRename(label: IssueLabel, name: string) {
    if (!name.trim() || name === label.name) return;
    setLabels((prev) => prev.map((l) => (l.id === label.id ? { ...l, name } : l)));
    const result = await updateLabel(label.id, { name, color: label.color });
    if (!result.ok) {
      setLabels((prev) => prev.map((l) => (l.id === label.id ? label : l)));
      toast.error(t("settings.labels.updateError"));
    }
  }

  async function handleColorChange(label: IssueLabel, color: LabelColor) {
    setLabels((prev) => prev.map((l) => (l.id === label.id ? { ...l, color } : l)));
    const result = await updateLabel(label.id, { name: label.name, color });
    if (!result.ok) {
      setLabels((prev) => prev.map((l) => (l.id === label.id ? label : l)));
      toast.error(t("settings.labels.updateError"));
    }
  }

  async function handleDelete(label: IssueLabel) {
    setPendingDelete(null);
    const previous = labels;
    setLabels((prev) => prev.filter((l) => l.id !== label.id));
    const result = await deleteLabel(label.id);
    if (!result.ok) {
      setLabels(previous);
      toast.error(t("settings.labels.deleteError"));
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const result = await createLabel(newName, newColor);
    setCreating(false);
    if (!result.ok) {
      toast.error(t("settings.labels.createError"));
      return;
    }
    setLabels((prev) => [...prev, result.data]);
    setNewName("");
    setNewColor("grey");
  }

  function usageLabel(id: string): string {
    const count = usage[id] ?? 0;
    return count === 0 ? t("settings.labels.usageNone") : `${count} ${t("settings.labels.usage")}`;
  }

  return (
    <SettingsPage title={t("settings.labels.title")} description={t("settings.labels.description")}>
      <SettingsSection flush>
        {labels.length === 0 && (
          <p className="text-mini text-text-tertiary">{t("settings.labels.empty")}</p>
        )}

        {labels.map((label) => (
          <div key={label.id} className="flex items-center gap-2">
            <Badge color={label.color} className="w-28 shrink-0 justify-center truncate">
              {label.name}
            </Badge>
            <InlineRenameInput
              className="flex-1"
              value={label.name}
              ariaLabel={t("settings.labels.name.placeholder")}
              onRename={(next) => handleRename(label, next)}
            />
            <span className="w-24 shrink-0 text-right text-mini text-text-tertiary [font-variant-numeric:tabular-nums]">
              {usageLabel(label.id)}
            </span>
            <ColorSelect
              value={label.color}
              onValueChange={(color) => handleColorChange(label, color)}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("settings.labels.delete.label")}
              onClick={() => setPendingDelete(label)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </SettingsSection>

      <SettingsSection title={t("settings.labels.addSection")} flush>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            aria-label={t("settings.labels.name.placeholder")}
            placeholder={t("settings.labels.name.placeholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
          />
          <ColorSelect value={newColor} onValueChange={setNewColor} />
          <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
            {t("settings.labels.add")}
          </Button>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={t("confirm.deleteLabel.title")}
        description={t("confirm.deleteLabel.description")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete);
        }}
      />
    </SettingsPage>
  );
}
