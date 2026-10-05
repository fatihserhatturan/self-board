"use client";

import { useDateFormatter } from "@/lib/use-date-formatter";
import { useNow } from "@/lib/use-now";

export interface RelativeTimeProps {
  iso: string;
  className?: string;
}

/**
 * "3 saat önce" — üzerine gelince tam tarih. Sunucuda ve ilk boyamada boş
 * (bkz. `useNow`), mount sonrası doluyor.
 */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const now = useNow();
  const { formatRelative, formatDateTime } = useDateFormatter();
  const date = new Date(iso);

  return (
    <time dateTime={iso} title={formatDateTime(date)} className={className} suppressHydrationWarning>
      {now === null ? "" : formatRelative(date, now)}
    </time>
  );
}
