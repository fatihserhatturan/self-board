"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { updateCurrentUser } from "@/lib/actions/users";
import type { Person } from "@/lib/data/issues";

export interface ProfileSettingsProps {
  currentUser: Person | null;
}

export function ProfileSettings({ currentUser }: ProfileSettingsProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  const dirty = name !== (currentUser?.name ?? "") || email !== (currentUser?.email ?? "");

  async function handleSave() {
    setSubmitting(true);
    const result = await updateCurrentUser(name, email);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(
        result.error === "email-taken"
          ? t("settings.profile.emailTaken")
          : t("settings.profile.updateError"),
      );
      return;
    }
    toast.success(t("settings.profile.updateSuccess"));
    router.refresh();
  }

  return (
    <SettingsPage title={t("settings.profile.title")} description={t("settings.profile.description")}>
      <SettingsSection>
        <SettingsRow
          label={t("settings.profile.avatar.label")}
          description={t("settings.profile.avatar.hint")}
          control={
            <div className="flex justify-end">
              <Avatar name={name || "?"} size="lg" />
            </div>
          }
        />
        <SettingsRow
          label={t("settings.profile.name.label")}
          htmlFor="profile-name"
          control={
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          }
        />
        <SettingsRow
          label={t("settings.profile.email.label")}
          htmlFor="profile-email"
          control={
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          }
        />
      </SettingsSection>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={submitting}
          disabled={!dirty || !name.trim() || !email.trim()}
        >
          {t("common.save")}
        </Button>
      </div>
    </SettingsPage>
  );
}
