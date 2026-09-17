"use client";

import { useState } from "react";
import { useSyncedState } from "@/lib/use-synced-state";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineRenameInput } from "@/components/ui/inline-rename-input";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import { SettingsPage, SettingsSection } from "@/components/settings/settings-primitives";
import { createUser, deleteUser, setCurrentUser, updateUser } from "@/lib/actions/users";
import type { Person } from "@/lib/data/issues";

export interface MemberSettingsProps {
  members: Person[];
  currentUserId: string | null;
}

export function MemberSettings({ members: initialMembers, currentUserId }: MemberSettingsProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [members, setMembers] = useSyncedState(initialMembers);
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleUpdate(member: Person, patch: Partial<Pick<Person, "name" | "email">>) {
    const next = { name: patch.name ?? member.name, email: patch.email ?? member.email };
    if (next.name === member.name && next.email === member.email) return;

    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, ...next } : m)));
    const result = await updateUser(member.id, next);
    if (!result.ok) {
      setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
      toast.error(
        result.error === "email-taken"
          ? t("settings.members.emailTaken")
          : t("settings.members.updateError"),
      );
      return;
    }
    router.refresh();
  }

  async function handleSetCurrent(member: Person) {
    const result = await setCurrentUser(member.id);
    if (!result.ok) {
      toast.error(t("settings.members.updateError"));
      return;
    }
    router.refresh();
  }

  async function handleDelete(member: Person) {
    setPendingDelete(null);
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    const result = await deleteUser(member.id);
    if (!result.ok) {
      setMembers(previous);
      toast.error(
        result.error === "cannot-delete-current-user"
          ? t("settings.members.cannotDeleteCurrent")
          : t("settings.members.deleteError"),
      );
      return;
    }
    router.refresh();
  }

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    const result = await createUser(newName, newEmail);
    setCreating(false);
    if (!result.ok) {
      toast.error(
        result.error === "email-taken"
          ? t("settings.members.emailTaken")
          : t("settings.members.createError"),
      );
      return;
    }
    setMembers((prev) => [...prev, result.data]);
    setNewName("");
    setNewEmail("");
    router.refresh();
  }

  return (
    <SettingsPage
      title={t("settings.members.title")}
      description={t("settings.members.description")}
    >
      <SettingsSection flush>
        {members.map((member) => {
          const isCurrent = member.id === currentUserId;
          return (
            <div key={member.id} className="flex items-center gap-2">
              <Avatar name={member.name} size="sm" />
              <InlineRenameInput
                className="w-40 shrink-0"
                value={member.name}
                ariaLabel={t("settings.members.name.placeholder")}
                onRename={(next) => handleUpdate(member, { name: next })}
              />
              <InlineRenameInput
                className="flex-1"
                value={member.email}
                ariaLabel={t("settings.members.email.placeholder")}
                onRename={(next) => handleUpdate(member, { email: next })}
              />
              {isCurrent ? (
                <Badge size="sm" color="blue" className="shrink-0">
                  {t("settings.members.you")}
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleSetCurrent(member)}
                >
                  {t("settings.members.setCurrent")}
                </Button>
              )}
              <Tooltip
                content={
                  isCurrent
                    ? t("settings.members.cannotDeleteCurrent")
                    : t("settings.members.delete.label")
                }
              >
                {/* disabled butonlar pointer olayı üretmiyor — tooltip tetikleyicisi
                    etkileşimde kalan bir span'i sarıyor (top-bar.tsx ile aynı desen). */}
                <span className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("settings.members.delete.label")}
                    disabled={isCurrent}
                    onClick={() => setPendingDelete(member)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </span>
              </Tooltip>
            </div>
          );
        })}
      </SettingsSection>

      <SettingsSection title={t("settings.members.addSection")} flush>
        <div className="flex items-center gap-2">
          <Input
            className="w-40 shrink-0"
            aria-label={t("settings.members.name.placeholder")}
            placeholder={t("settings.members.name.placeholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            className="flex-1"
            type="email"
            aria-label={t("settings.members.email.placeholder")}
            placeholder={t("settings.members.email.placeholder")}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
          />
          <Button
            onClick={handleCreate}
            loading={creating}
            disabled={!newName.trim() || !newEmail.trim()}
          >
            {t("settings.members.add")}
          </Button>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={t("confirm.deleteMember.title")}
        description={t("confirm.deleteMember.description")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete);
        }}
      />
    </SettingsPage>
  );
}
