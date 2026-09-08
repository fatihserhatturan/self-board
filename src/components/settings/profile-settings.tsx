"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
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
    <section className="flex flex-col gap-4">
      <h2 className="text-large font-medium text-text-primary">{t("settings.profile.title")}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">{t("settings.profile.name.label")}</Label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-email">{t("settings.profile.email.label")}</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <Button
        className="self-start"
        onClick={handleSave}
        loading={submitting}
        disabled={!name.trim() || !email.trim()}
      >
        {t("common.save")}
      </Button>
    </section>
  );
}
