"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  Columns3,
  Database,
  Info,
  Keyboard,
  type LucideIcon,
  Palette,
  Puzzle,
  RotateCw,
  SlidersHorizontal,
  Tag,
  User,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/components/locale-provider";
import type { TranslationKey } from "@/lib/i18n/types";
import { WORKSPACE } from "@/lib/app-shell-data";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  href: Route;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

interface SettingsNavGroup {
  titleKey: TranslationKey;
  items: SettingsNavItem[];
}

/**
 * Linear'ın ayarlar düzeni: hesap, çalışma alanı ve uygulama olarak üç grup.
 * Sıralama bilinçli — en sık dokunulan kişisel ayarlar üstte.
 */
const NAV_GROUPS: SettingsNavGroup[] = [
  {
    titleKey: "settings.group.account",
    items: [
      { href: "/settings/profile", labelKey: "settings.profile.title", icon: User },
      { href: "/settings/appearance", labelKey: "settings.appearance.title", icon: Palette },
      {
        href: "/settings/preferences",
        labelKey: "settings.preferences.title",
        icon: SlidersHorizontal,
      },
      { href: "/settings/shortcuts", labelKey: "settings.shortcuts.title", icon: Keyboard },
    ],
  },
  {
    titleKey: "settings.group.workspace",
    items: [
      { href: "/settings/workflow", labelKey: "settings.workflow.title", icon: Columns3 },
      { href: "/settings/labels", labelKey: "settings.labels.title", icon: Tag },
      { href: "/settings/members", labelKey: "settings.members.title", icon: Users },
      { href: "/settings/cycles", labelKey: "settings.cycles.title", icon: RotateCw },
      { href: "/settings/modules", labelKey: "settings.modules.title", icon: Puzzle },
    ],
  },
  {
    titleKey: "settings.group.application",
    items: [
      { href: "/settings/data", labelKey: "settings.data.title", icon: Database },
      { href: "/settings/about", labelKey: "settings.about.title", icon: Info },
    ],
  },
];

/**
 * Ayarlar tüm pencereyi devralıyor: bu route `(app)` grubunun dışında olduğu
 * için uygulama kenar çubuğu ve üst çubuk render edilmiyor, yerini bu kabuk
 * alıyor. Böylece yan yana iki dikey navigasyon oluşmuyor.
 */
export function SettingsShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border-default bg-bg-app">
        <div className="flex flex-col gap-1 p-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-small text-text-secondary transition-colors hover:bg-bg-muted hover:text-text-primary"
          >
            <ChevronLeft className="size-3.5 shrink-0" />
            <span className="truncate">{t("settings.backToApp")}</span>
          </Link>
          <div className="px-2 pb-1 pt-2">
            <p className="truncate text-small font-medium text-text-primary">{WORKSPACE.name}</p>
            <p className="text-mini text-text-tertiary">{t("common.settings")}</p>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-4 px-2 pb-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.titleKey} className="flex flex-col gap-0.5">
                <p className="px-2 pb-1 text-micro font-medium uppercase tracking-wide text-text-tertiary">
                  {t(group.titleKey)}
                </p>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-small text-text-secondary transition-colors",
                        "hover:bg-bg-muted hover:text-text-primary",
                        isActive && "bg-bg-muted font-medium text-text-primary",
                      )}
                    >
                      <item.icon className="size-3.5 shrink-0" />
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-3xl px-10 py-10">{children}</div>
      </ScrollArea>
    </div>
  );
}
