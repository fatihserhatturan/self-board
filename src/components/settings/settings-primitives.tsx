import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SettingsPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Ayarların üç yerleşim ilkelinden ilki. Her sayfa aynı başlık bloğu ve aynı
 * bölüm aralığıyla açılıyor; sayfa başına özel yerleşim yazılmıyor, tutarlılık
 * buradan geliyor.
 */
export function SettingsPage({ title, description, children }: SettingsPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-title3 font-medium text-text-primary">{title}</h1>
        {description && <p className="text-small text-text-secondary">{description}</p>}
      </header>
      {children}
    </div>
  );
}

export interface SettingsSectionProps {
  title?: string;
  description?: string;
  /** Satırlar arasına ayırıcı koymaz — serbest içerik (liste, tablo) için. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  flush = false,
  className,
  children,
}: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      {(title || description) && (
        <div className="flex flex-col gap-0.5">
          {title && <h2 className="text-small font-medium text-text-primary">{title}</h2>}
          {description && <p className="text-mini text-text-tertiary">{description}</p>}
        </div>
      )}
      <div
        className={cn(
          flush ? "flex flex-col gap-2" : "flex flex-col divide-y divide-border-default",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export interface SettingsRowProps {
  label: string;
  description?: string;
  /** Sağa hizalı kontrol. Verilmezse satır yalnızca metin taşır. */
  control?: ReactNode;
  /** Etiketin solunda duran küçük görsel — proje ikonu, avatar. */
  leading?: ReactNode;
  /** Kontrolü etikete `htmlFor` ile bağlamak için. */
  htmlFor?: string;
  /** Kontrol genişse (metin alanı, uzun liste) alt alta dizer. */
  stacked?: boolean;
}

/**
 * Solda etiket ve açıklama, sağda kontrol. Etiketler dikey bir dizin
 * oluşturduğu için sayfa okunmadan taranabiliyor — ayarların "premium"
 * hissinin büyük kısmı bu hizadan geliyor.
 */
export function SettingsRow({
  label,
  description,
  control,
  leading,
  htmlFor,
  stacked = false,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex gap-6 py-3.5 first:pt-0 last:pb-0",
        stacked ? "flex-col gap-2" : "items-center justify-between",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {leading}
        <div className="flex min-w-0 flex-col gap-0.5">
          {htmlFor ? (
            <label htmlFor={htmlFor} className="text-small text-text-primary">
              {label}
            </label>
          ) : (
            <span className="text-small text-text-primary">{label}</span>
          )}
          {description && <span className="text-mini text-text-tertiary">{description}</span>}
        </div>
      </div>
      {control && <div className={cn(stacked ? "w-full" : "w-56 shrink-0")}>{control}</div>}
    </div>
  );
}
