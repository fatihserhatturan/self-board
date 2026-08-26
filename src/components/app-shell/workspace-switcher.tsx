"use client";

import Link from "next/link";
import { ChevronDown, Settings, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/locale-provider";

export interface WorkspaceSwitcherProps {
  workspaceName: string;
}

export function WorkspaceSwitcher({ workspaceName }: WorkspaceSwitcherProps) {
  const { t } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small font-medium text-text-primary transition-colors hover:bg-bg-muted">
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-accent">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed 14px static asset, next/image adds no benefit */}
          <img src="/app-icon.png" alt="" width={14} height={14} className="size-3.5" />
        </span>
        <span className="flex-1 truncate text-left">{workspaceName}</span>
        <ChevronDown className="size-3.5 shrink-0 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-3.5" /> {t("common.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <UserPlus className="size-3.5" /> {t("workspaceSwitcher.inviteUser")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
