"use client";

import { Kbd, ModKey } from "@/components/ui/kbd";
import { useLocale } from "@/components/locale-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import type { TranslationKey } from "@/lib/i18n/types";

/** `mod` true ise başına platforma göre Ctrl/⌘ eklenir. */
interface Shortcut {
  labelKey: TranslationKey;
  keys: string[];
  mod?: boolean;
}

/**
 * Yalnızca gerçekten uygulanmış kısayollar listeleniyor. Kaynaklar:
 * `app-shell-provider.tsx` (palet, yeni issue, kenar çubuğu),
 * `issue-workspace.tsx` (cycle paneli), iki issue dialog'u (kaydet),
 * `issue-list-row.tsx` / `issue-card.tsx` (issue açma).
 */
const GLOBAL_SHORTCUTS: Shortcut[] = [
  { labelKey: "settings.shortcuts.commandPalette", keys: ["K"], mod: true },
  { labelKey: "settings.shortcuts.newIssue", keys: ["C"] },
  { labelKey: "settings.shortcuts.toggleSidebar", keys: ["B"], mod: true },
];

const ISSUE_SHORTCUTS: Shortcut[] = [
  { labelKey: "settings.shortcuts.openIssue", keys: ["Enter"] },
  { labelKey: "settings.shortcuts.toggleCyclePanel", keys: ["I"], mod: true },
  { labelKey: "settings.shortcuts.submitDialog", keys: ["Enter"], mod: true },
  { labelKey: "settings.shortcuts.closeDialog", keys: ["Esc"] },
];

function ShortcutKeys({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {shortcut.mod && <ModKey />}
      {shortcut.keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </div>
  );
}

export function ShortcutSettings() {
  const { t } = useLocale();

  return (
    <SettingsPage
      title={t("settings.shortcuts.title")}
      description={t("settings.shortcuts.description")}
    >
      <SettingsSection title={t("settings.shortcuts.group.global")}>
        {GLOBAL_SHORTCUTS.map((shortcut) => (
          <SettingsRow
            key={shortcut.labelKey}
            label={t(shortcut.labelKey)}
            control={<ShortcutKeys shortcut={shortcut} />}
          />
        ))}
      </SettingsSection>

      <SettingsSection title={t("settings.shortcuts.group.issues")}>
        {ISSUE_SHORTCUTS.map((shortcut) => (
          <SettingsRow
            key={shortcut.labelKey}
            label={t(shortcut.labelKey)}
            control={<ShortcutKeys shortcut={shortcut} />}
          />
        ))}
      </SettingsSection>
    </SettingsPage>
  );
}
