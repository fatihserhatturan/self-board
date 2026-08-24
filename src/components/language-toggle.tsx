"use client";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <Tooltip content={t("localeToggle.label")}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("localeToggle.label")}
        onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
      >
        <span className="text-mini font-medium uppercase">{locale}</span>
      </Button>
    </Tooltip>
  );
}
