"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColorSelect } from "@/components/ui/color-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineRenameInput } from "@/components/ui/inline-rename-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { createLabel, deleteLabel, updateLabel, type LabelColor } from "@/lib/actions/labels";
import type { IssueLabel } from "@/lib/data/issues";

export interface LabelSettingsProps {
  labels: IssueLabel[];
}

export function LabelSettings({ labels: initialLabels }: LabelSettingsProps) {
  const { t } = useLocale();
  const [labels, setLabels] = useState(initialLabels);
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

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-large font-medium text-text-primary">{t("settings.labels.title")}</h2>

      {labels.length === 0 && (
        <p className="text-mini text-text-tertiary">{t("settings.labels.empty")}</p>
      )}

      <div className="flex flex-col gap-2">
        {labels.map((label) => (
          <div key={label.id} className="flex items-center gap-2">
            <Badge color={label.color} className="shrink-0">
              {label.name}
            </Badge>
            <InlineRenameInput
              className="flex-1"
              value={label.name}
              ariaLabel={t("settings.labels.name.placeholder")}
              onRename={(next) => handleRename(label, next)}
            />
            <ColorSelect value={label.color} onValueChange={(color) => handleColorChange(label, color)} />
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
      </div>

      <div className="flex items-center gap-2">
        <Label className="sr-only" htmlFor="new-label-name">
          {t("settings.labels.name.placeholder")}
        </Label>
        <Input
          id="new-label-name"
          className="flex-1"
          placeholder={t("settings.labels.name.placeholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <ColorSelect value={newColor} onValueChange={setNewColor} />
        <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
          {t("settings.labels.add")}
        </Button>
      </div>

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
    </section>
  );
}
