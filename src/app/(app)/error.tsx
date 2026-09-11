"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/locale-provider";

/**
 * `(app)` altındaki sayfa hatalarını yakalar (bozuk DB satırı, eksik proje
 * id'si vb.). Electron kabuğunda ham Next hata ekranının geri dönüş yolu
 * olmadığı için burada her zaman bir "tekrar dene" çıkışı sunuluyor.
 * Layout'un kendi hatası bu sınıra düşmez — onu `global-error.tsx` yakalar.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title={t("error.title")}
      description={t("error.description")}
      action={{ label: t("error.retry"), onClick: reset }}
    />
  );
}
