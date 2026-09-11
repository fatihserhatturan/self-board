"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { usePreferences } from "@/components/preferences-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { updatePreferences } from "@/lib/actions/preferences";
import { HOME_VIEWS, type HomeView, type Preferences } from "@/lib/preferences-config";
import { priorityLevels } from "@/lib/token-manifest";
import { STATUS_TYPES, type StatusType } from "@/lib/board/workflow-config";

const HOME_VIEW_LABEL_KEY = {
  "my-issues": "nav.myIssues",
  issues: "nav.issues",
  cycles: "nav.cycles",
} as const;

export function PreferencesSettings() {
  const { t } = useLocale();
  const router = useRouter();
  const preferences = usePreferences();
  const [saving, setSaving] = useState(false);

  async function save(patch: Partial<Preferences>) {
    setSaving(true);
    const result = await updatePreferences(patch);
    setSaving(false);
    if (!result.ok) {
      toast.error(t("settings.preferences.saveError"));
      return;
    }
    router.refresh();
  }

  return (
    <SettingsPage
      title={t("settings.preferences.title")}
      description={t("settings.preferences.description")}
    >
      <SettingsSection>
        <SettingsRow
          label={t("settings.preferences.homeView.label")}
          description={t("settings.preferences.homeView.description")}
          control={
            <Select
              value={preferences.homeView}
              onValueChange={(v) => void save({ homeView: v as HomeView })}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOME_VIEWS.map((view) => (
                  <SelectItem key={view} value={view}>
                    {t(HOME_VIEW_LABEL_KEY[view])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingsSection>

      <SettingsSection
        title={t("settings.preferences.newIssue.title")}
        description={t("settings.preferences.newIssue.description")}
      >
        <SettingsRow
          label={t("settings.preferences.defaultStatus.label")}
          description={t("settings.preferences.defaultStatus.description")}
          control={
            <Select
              value={preferences.defaultIssueStateType}
              onValueChange={(v) => void save({ defaultIssueStateType: v as StatusType })}
              disabled={saving}
            >
              <SelectTrigger>
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
          }
        />

        <SettingsRow
          label={t("settings.preferences.defaultPriority.label")}
          control={
            <Select
              value={preferences.defaultIssuePriority}
              onValueChange={(v) =>
                void save({ defaultIssuePriority: v as Preferences["defaultIssuePriority"] })
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`board.priority.${priority}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <SettingsRow
          label={t("settings.preferences.autoAssign.label")}
          description={t("settings.preferences.autoAssign.description")}
          control={
            <div className="flex justify-end">
              <Switch
                checked={preferences.autoAssignToMe}
                onCheckedChange={(checked) => void save({ autoAssignToMe: checked })}
                disabled={saving}
                aria-label={t("settings.preferences.autoAssign.label")}
              />
            </div>
          }
        />
      </SettingsSection>
    </SettingsPage>
  );
}
