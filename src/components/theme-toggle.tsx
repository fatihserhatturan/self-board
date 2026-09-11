"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useMounted } from "@/lib/use-mounted";

export function ThemeToggle() {
  const { t } = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t("settings.appearance.theme.toggle")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
