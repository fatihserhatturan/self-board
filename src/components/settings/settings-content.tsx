"use client";

import { TopBar } from "@/components/app-shell/top-bar";
import { Divider } from "@/components/ui/divider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/components/locale-provider";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { LabelSettings } from "@/components/settings/label-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import type { IssueLabel, Person } from "@/lib/data/issues";

export interface SettingsContentProps {
  labels: IssueLabel[];
  currentUser: Person | null;
}

export function SettingsContent({ labels, currentUser }: SettingsContentProps) {
  const { t } = useLocale();

  return (
    <>
      <TopBar title={t("common.settings")} />
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 px-6 py-6">
          <AppearanceSettings />
          <Divider />
          <ProfileSettings currentUser={currentUser} />
          <Divider />
          <LabelSettings labels={labels} />
        </div>
      </ScrollArea>
    </>
  );
}
