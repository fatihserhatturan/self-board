"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { createLabel, deleteLabel, updateLabel, type LabelColor } from "@/lib/actions/labels";
import type { IssueLabel } from "@/lib/data/issues";

const LABEL_COLORS: LabelColor[] = [
  "teal",
  "red",
  "mustard",
  "yellow",
  "orange",
  "purple",
  "blue",
  "grey",
  "green",
];

const COLOR_DOT_CLASS: Record<LabelColor, string> = {
  teal: "bg-label-teal",
  red: "bg-label-red",
  mustard: "bg-label-mustard",
  yellow: "bg-label-yellow",
  orange: "bg-label-orange",
  purple: "bg-label-purple",
  blue: "bg-label-blue",
  grey: "bg-label-grey",
  green: "bg-label-green",
};

function ColorSelect({
  value,
  onValueChange,
}: {
  value: LabelColor;
  onValueChange: (color: LabelColor) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as LabelColor)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LABEL_COLORS.map((color) => (
          <SelectItem key={color} value={color}>
            <span className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${COLOR_DOT_CLASS[color]}`} />
              {color[0].toUpperCase() + color.slice(1)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface LabelSettingsProps {
  labels: IssueLabel[];
}

export function LabelSettings({ labels: initialLabels }: LabelSettingsProps) {
  const { t } = useLocale();
  const [labels, setLabels] = useState(initialLabels);
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
            <Input
              className="flex-1"
              defaultValue={label.name}
              key={`${label.id}-${label.name}`}
              onBlur={(e) => handleRename(label, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <ColorSelect value={label.color} onValueChange={(color) => handleColorChange(label, color)} />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("settings.labels.delete.label")}
              onClick={() => handleDelete(label)}
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
    </section>
  );
}
