"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/locale-provider";

const ROW_COUNT = 8;

/**
 * `(app)/loading.tsx` fallback'i. Tüm route'lar `force-dynamic` ve SQLite
 * okuyor; bu iskelet olmadan navigasyon ile içeriğin gelmesi arasında hiçbir
 * geri bildirim yoktu. Gerçek yerleşimi taklit ediyor: sabit yükseklikli üst
 * çubuk, ardından liste satırları.
 */
export function PageSkeleton() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label={t("common.loading")}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-default px-4">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-3.5 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-16 shrink-0" />
            <Skeleton className="h-3 flex-1" style={{ maxWidth: `${70 - index * 5}%` }} />
            <Skeleton className="size-6 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
