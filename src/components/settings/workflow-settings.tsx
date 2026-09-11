"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorSelect } from "@/components/ui/color-select";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InlineRenameInput } from "@/components/ui/inline-rename-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusIcon } from "@/components/ui/status-icon";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "@/components/settings/settings-primitives";
import {
  createWorkflowState,
  deleteWorkflowState,
  moveWorkflowState,
  updateWorkflowState,
} from "@/lib/actions/workflow-states";
import type { LabelColor } from "@/lib/actions/labels";
import type { Project } from "@/lib/data/projects";
import {
  STATE_ICON_NAMES,
  STATUS_TYPES,
  resolveStateIcon,
  type StatusType,
  type WorkflowState,
} from "@/lib/board/workflow-config";
import { COLOR_TEXT_CLASS } from "@/lib/board/color-tokens";
import { cn } from "@/lib/utils";

export interface WorkflowSettingsProps {
  projects: Project[];
  /** Tüm projelerin durumları; seçime göre istemcide filtreleniyor, her proje değişiminde sunucuya gidilmiyor. */
  states: WorkflowState[];
}

/** İkon ızgarası — seçili setten bir ad döndürür. */
function IconPicker({
  value,
  color,
  label,
  onSelect,
}: {
  value: string;
  color: LabelColor;
  label: string;
  onSelect: (icon: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" aria-label={label}>
          {createElement(resolveStateIcon(value), {
            className: cn("size-4", COLOR_TEXT_CLASS[color]),
          })}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="grid grid-cols-8 gap-1">
          {STATE_ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                onClick={() => {
                  onSelect(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors hover:bg-bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                  name === value && "bg-bg-muted",
                )}
              >
                {createElement(resolveStateIcon(name), {
                  className: cn("size-4", COLOR_TEXT_CLASS[color]),
                })}
              </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function WorkflowSettings({ projects, states: allStates }: WorkflowSettingsProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [pendingDelete, setPendingDelete] = useState<WorkflowState | null>(null);
  const [replacementId, setReplacementId] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<StatusType>("unstarted");
  const [newColor, setNewColor] = useState<LabelColor>("grey");
  const [newIcon, setNewIcon] = useState("circle");
  const [busy, setBusy] = useState(false);

  const states = allStates.filter((state) => state.projectId === projectId);

  function reportError(error: string, fallbackKey: "update" | "delete" | "create") {
    if (error === "last-completed-state") {
      toast.error(t("settings.workflow.lastCompleted"));
      return;
    }
    if (error === "cannot-delete-last-state") {
      toast.error(t("settings.workflow.cannotDeleteLast"));
      return;
    }
    toast.error(
      t(
        fallbackKey === "create"
          ? "settings.workflow.createError"
          : fallbackKey === "delete"
            ? "settings.workflow.deleteError"
            : "settings.workflow.updateError",
      ),
    );
  }

  async function save(state: WorkflowState, patch: Partial<WorkflowState>) {
    const next = {
      name: patch.name ?? state.name,
      type: patch.type ?? state.type,
      color: patch.color ?? state.color,
      icon: patch.icon ?? state.icon,
    };
    setBusy(true);
    const result = await updateWorkflowState(state.id, next);
    setBusy(false);
    if (!result.ok) {
      reportError(result.error, "update");
      return;
    }
    router.refresh();
  }

  async function move(state: WorkflowState, direction: "up" | "down") {
    setBusy(true);
    const result = await moveWorkflowState(state.id, direction);
    setBusy(false);
    if (!result.ok) {
      toast.error(t("settings.workflow.moveError"));
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!pendingDelete || !replacementId) return;
    setBusy(true);
    const result = await deleteWorkflowState(pendingDelete.id, replacementId);
    setBusy(false);
    setPendingDelete(null);
    if (!result.ok) {
      reportError(result.error, "delete");
      return;
    }
    router.refresh();
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setBusy(true);
    const result = await createWorkflowState({
      projectId,
      name: newName,
      type: newType,
      color: newColor,
      icon: newIcon,
    });
    setBusy(false);
    if (!result.ok) {
      reportError(result.error, "create");
      return;
    }
    setNewName("");
    router.refresh();
  }

  function openDelete(state: WorkflowState) {
    setPendingDelete(state);
    setReplacementId(states.find((candidate) => candidate.id !== state.id)?.id ?? "");
  }

  return (
    <SettingsPage
      title={t("settings.workflow.title")}
      description={t("settings.workflow.description")}
    >
      <SettingsSection>
        <SettingsRow
          label={t("settings.workflow.project.label")}
          control={
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingsSection>

      <SettingsSection title={t("settings.workflow.states.title")} flush>
        {states.map((state, index) => (
          <div key={state.id} className="flex items-center gap-2">
            <IconPicker
              value={state.icon}
              color={state.color}
              label={t("settings.workflow.icon.label")}
              onSelect={(icon) => void save(state, { icon })}
            />
            <InlineRenameInput
              className="flex-1"
              value={state.name}
              ariaLabel={t("settings.workflow.name.placeholder")}
              onRename={(name) => void save(state, { name })}
            />
            <Select
              value={state.type}
              onValueChange={(type) => void save(state, { type: type as StatusType })}
              disabled={busy}
            >
              <SelectTrigger className="w-36" aria-label={t("settings.workflow.type.label")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`status.type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ColorSelect
              value={state.color}
              onValueChange={(color) => void save(state, { color })}
            />
            <Tooltip content={t("settings.workflow.moveUp")}>
              <span className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("settings.workflow.moveUp")}
                  disabled={index === 0 || busy}
                  onClick={() => void move(state, "up")}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
              </span>
            </Tooltip>
            <Tooltip content={t("settings.workflow.moveDown")}>
              <span className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("settings.workflow.moveDown")}
                  disabled={index === states.length - 1 || busy}
                  onClick={() => void move(state, "down")}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("settings.workflow.delete.label")}
              disabled={states.length <= 1 || busy}
              onClick={() => openDelete(state)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </SettingsSection>

      <SettingsSection title={t("settings.workflow.addSection")} flush>
        <div className="flex items-center gap-2">
          <IconPicker
            value={newIcon}
            color={newColor}
            label={t("settings.workflow.icon.label")}
            onSelect={setNewIcon}
          />
          <Input
            className="flex-1"
            aria-label={t("settings.workflow.name.placeholder")}
            placeholder={t("settings.workflow.name.placeholder")}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
            }}
          />
          <Select value={newType} onValueChange={(type) => setNewType(type as StatusType)}>
            <SelectTrigger className="w-36" aria-label={t("settings.workflow.type.label")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`status.type.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColorSelect value={newColor} onValueChange={setNewColor} />
          <Button onClick={handleCreate} loading={busy} disabled={!newName.trim()}>
            {t("settings.workflow.add")}
          </Button>
        </div>
      </SettingsSection>

      {/* Silme, issue'ların taşınacağı durumu da sormak zorunda — ortak
          `ConfirmDialog` ek bir alan taşımadığı için bu sayfaya özel. */}
      <Dialog
        open={pendingDelete != null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent size="sm">
          <DialogTitle>{t("confirm.deleteState.title")}</DialogTitle>
          <DialogDescription>{t("confirm.deleteState.description")}</DialogDescription>

          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="state-replacement">{t("confirm.deleteState.replacement")}</Label>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger id="state-replacement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {states
                  .filter((state) => state.id !== pendingDelete?.id)
                  .map((state) => (
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

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              loading={busy}
              disabled={!replacementId}
              onClick={handleDelete}
            >
              {t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsPage>
  );
}
