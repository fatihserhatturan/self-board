"use client";

import Link from "next/link";
import { ChevronDown, Settings, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WorkspaceSwitcherProps {
  workspaceName: string;
}

export function WorkspaceSwitcher({ workspaceName }: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small font-medium text-text-primary transition-colors hover:bg-bg-muted">
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-accent text-micro font-semibold text-text-on-accent">
          {workspaceName.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 truncate text-left">{workspaceName}</span>
        <ChevronDown className="size-3.5 shrink-0 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-3.5" /> Ayarlar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <UserPlus className="size-3.5" /> Kullanıcı davet et
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
