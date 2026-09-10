"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SidebarNavItemProps {
  href: Route;
  icon: LucideIcon;
  label: string;
  badge?: number;
  indent?: boolean;
}

export function SidebarNavItem({ href, icon: Icon, label, badge, indent }: SidebarNavItemProps) {
  const pathname = usePathname();
  const hrefPathname = href.split("?")[0];
  const isActive = pathname === hrefPathname || pathname.startsWith(`${hrefPathname}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-small text-text-secondary transition-colors",
        "hover:bg-bg-muted hover:text-text-primary",
        isActive && "bg-bg-muted font-medium text-text-primary",
        indent && "ml-5",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <Badge size="sm" color="grey">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
