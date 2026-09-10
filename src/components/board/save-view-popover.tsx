"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { createView, updateView, type CreateViewInput } from "@/lib/actions/views";
import type { SavedView } from "@/lib/data/views";

export interface SaveViewPopoverProps {
  input: Omit<CreateViewInput, "name">;
  loadedView: SavedView | null;
  onSaved?: () => void;
}

function hasViewChanged(loadedView: SavedView, input: Omit<CreateViewInput, "name">): boolean {
  return (
    loadedView.layout !== input.layout ||
    JSON.stringify(loadedView.filters) !== JSON.stringify(input.filters) ||
    JSON.stringify(loadedView.options) !== JSON.stringify(input.options)
  );
}

export function SaveViewPopover({ input, loadedView, onSaved }: SaveViewPopoverProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [savingAsNew, setSavingAsNew] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [updating, setUpdating] = useState(false);

  const canUpdate = loadedView != null && hasViewChanged(loadedView, input);

  function resetAndClose() {
    setName("");
    setShowNameInput(false);
    setOpen(false);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSavingAsNew(true);
    const result = await createView({ ...input, name });
    setSavingAsNew(false);
    if (!result.ok) {
      toast.error(t("views.saveDialog.createError"));
      return;
    }
    toast.success(t("views.saveDialog.saved"));
    resetAndClose();
    onSaved?.();
  }

  async function handleUpdate() {
    if (!loadedView) return;
    setUpdating(true);
    const result = await updateView(loadedView.id, { ...input, name: loadedView.name });
    setUpdating(false);
    if (!result.ok) {
      toast.error(t("views.saveDialog.updateError"));
      return;
    }
    toast.success(t("views.saveDialog.updated"));
    resetAndClose();
    onSaved?.();
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShowNameInput(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("topbar.saveView.label")}>
          <BookmarkPlus className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-2">
          {canUpdate && !showNameInput && (
            <>
              <Button size="sm" onClick={handleUpdate} loading={updating}>
                {t("views.saveDialog.update")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowNameInput(true)}>
                {t("views.saveDialog.saveAsNew")}
              </Button>
            </>
          )}

          {canUpdate && showNameInput && <Divider />}

          {(!canUpdate || showNameInput) && (
            <>
              <Label htmlFor="save-view-name" className="sr-only">
                {t("views.saveDialog.namePlaceholder")}
              </Label>
              <Input
                id="save-view-name"
                placeholder={t("views.saveDialog.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="self-end"
                onClick={handleCreate}
                loading={savingAsNew}
                disabled={!name.trim()}
              >
                {t("views.saveDialog.save")}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
