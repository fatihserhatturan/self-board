"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { createView, type CreateViewInput } from "@/lib/actions/views";

export interface SaveViewPopoverProps {
  input: Omit<CreateViewInput, "name">;
  onSaved?: () => void;
}

export function SaveViewPopover({ input, onSaved }: SaveViewPopoverProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const result = await createView({ ...input, name });
    setSaving(false);
    if (!result.ok) {
      toast.error(t("views.saveDialog.createError"));
      return;
    }
    toast.success(t("views.saveDialog.saved"));
    setName("");
    setOpen(false);
    onSaved?.();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("topbar.saveView.label")}>
          <BookmarkPlus className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-2">
          <Label htmlFor="save-view-name" className="sr-only">
            {t("views.saveDialog.namePlaceholder")}
          </Label>
          <Input
            id="save-view-name"
            placeholder={t("views.saveDialog.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            autoFocus
          />
          <Button
            size="sm"
            className="self-end"
            onClick={handleSave}
            loading={saving}
            disabled={!name.trim()}
          >
            {t("views.saveDialog.save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
