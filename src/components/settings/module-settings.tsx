"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "@/components/settings/settings-primitives";
import { setModuleEnabled } from "@/lib/actions/modules";
import { MODULE_REGISTRY } from "@/lib/modules/registry";
import { useSyncedState } from "@/lib/use-synced-state";

export interface ModuleSettingsProps {
  enabledModuleIds: string[];
}

/**
 * Modüllerin aç/kapa listesi. Kapatmak veriyi silmez (bkz.
 * `lib/modules/registry.ts`) — bu yüzden `ConfirmDialog` ile bir silme onayı
 * istemiyor, diğer ayarlar sayfalarındaki anlık `Switch` deseninin aynısı.
 */
export function ModuleSettings({ enabledModuleIds: initialEnabledModuleIds }: ModuleSettingsProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [enabledModuleIds, setEnabledModuleIds] = useSyncedState(initialEnabledModuleIds);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const enabledSet = new Set(enabledModuleIds);

  async function toggle(id: string, next: boolean) {
    setPendingId(id);
    setEnabledModuleIds((prev) =>
      next ? [...prev, id] : prev.filter((moduleId) => moduleId !== id),
    );
    const result = await setModuleEnabled(id, next);
    setPendingId(null);
    if (!result.ok) {
      setEnabledModuleIds((prev) =>
        next ? prev.filter((moduleId) => moduleId !== id) : [...prev, id],
      );
      toast.error(t("settings.modules.saveError"));
      return;
    }
    router.refresh();
  }

  return (
    <SettingsPage title={t("settings.modules.title")} description={t("settings.modules.description")}>
      <SettingsSection>
        {MODULE_REGISTRY.length === 0 ? (
          <p className="text-mini text-text-tertiary">{t("settings.modules.empty")}</p>
        ) : (
          MODULE_REGISTRY.map((module) => (
            <SettingsRow
              key={module.id}
              leading={<module.icon className="size-4 text-text-secondary" />}
              label={t(module.nameKey)}
              description={t(module.descriptionKey)}
              control={
                <div className="flex justify-end">
                  <Switch
                    checked={enabledSet.has(module.id)}
                    onCheckedChange={(checked) => void toggle(module.id, checked)}
                    disabled={pendingId === module.id}
                    aria-label={t(module.nameKey)}
                  />
                </div>
              }
            />
          ))
        )}
      </SettingsSection>
    </SettingsPage>
  );
}
