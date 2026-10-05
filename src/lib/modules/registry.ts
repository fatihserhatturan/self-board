import type { Route } from "next";
import type { DatabaseSync } from "node:sqlite";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";

/**
 * Uygulamanın çekirdeğine ek, varsayılan olarak KAPALI gelen opsiyonel
 * özellikler (ör. Wiki). DB'siz, saf modül — `lib/preferences-config.ts` ile
 * aynı gerekçeyle: hem `sidebar.tsx` gibi client component'lerden hem
 * `schema.ts`/`cascade.ts` gibi `node:sqlite`'a bağımlı dosyalardan güvenle
 * import edilebilsin (yalnızca `DatabaseSync` tipi, `import type` ile, bir
 * runtime import'a dönüşmüyor).
 *
 * Kayıt listesi kod ile sabit, kullanıcı tanımlı/DB'den gelen bir liste değil
 * — bu yüzden `nameKey`/`descriptionKey` gibi alanlar düz string değil
 * `TranslationKey`: var olmayan bir çeviri anahtarı yazılırsa derleme zamanında
 * hata verir (bkz. `lib/i18n/types.ts` — `TranslationKey = keyof typeof tr`).
 *
 * **Import kuralı:** bu dosya client bundle'ına giriyor. Bir modülün buradan
 * import edilen dosyası (ör. `modules/wiki/schema.ts`) yalnız `import type`,
 * saf sabitler ve `db` parametresi alan saf fonksiyonlar içerebilir —
 * `@/lib/db/*` ya da `node:*` runtime import'u yasak. Hem `node:sqlite`
 * tarayıcı chunk'ına sızardı, hem de `attachment-links.ts` → registry →
 * modül → `attachment-links.ts` import döngüsü oluşurdu.
 *
 * Etkinleştirme yalnızca GÖRÜNÜRLÜĞÜ kontrol eder, bir "kurulum" akışı değil:
 * kapatmak veriyi silmez, tekrar açılınca önceki veri yerinde durur (bkz.
 * `lib/db/modules.ts`). Modülün kendi tablosu (varsa) `ddl` alanıyla, modül
 * kapalıyken de her zaman kurulur — tıpkı `cycles`/`views` gibi diğer tüm
 * tabloların açılışta kurulması gibi (bkz. `lib/db/schema.ts`). SQLite için
 * birkaç boş tablonun maliyeti yok; "etkinleştirince tabloyu oluştur" gibi
 * ayrı bir kurulum akışına bu yüzden gerek duyulmadı.
 */
export interface ModuleDefinition {
  id: string;
  /**
   * "global": My Issues gibi tek, projeden bağımsız bir sayfa.
   * "per-project": aktif projeye bağlı (workflow_states/cycles gibi
   * `project_id` FK'lı), nav linki `?project=` ile tamamlanır.
   */
  scope: "global" | "per-project";
  icon: LucideIcon;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  nav: {
    /** Global modülde tam yol (`/wiki`); per-project modülde taban yol —
     * sidebar bunu `?project=activeProjectId` ile tamamlar (bkz. sidebar.tsx). */
    href: Route;
    labelKey: TranslationKey;
  };
  /**
   * Modülün kendi tablo(lar)ının DDL'i. Ayrı bir dosyada (ör.
   * `db/modules/wiki.ddl.ts`) saf bir string sabiti olarak tutulup buraya
   * bağlanır; `schema.ts` bunu ana `DDL_SQL`'e ekler (`CREATE TABLE IF NOT
   * EXISTS`, aynı idempotent desen).
   */
  ddl?: string;
  /**
   * Per-project modüller proje silinince kendi verisini temizlemek için bunu
   * tanımlar; `deleteProjectCascade` (`lib/db/cascade.ts`) registry'yi
   * tarayıp çağırır — yeni bir modül eklendiğinde cascade dosyasına elle satır
   * eklemek gerekmez.
   */
  onProjectDeleted?: (db: DatabaseSync, projectId: string) => void;
  /**
   * Modülün tabloları, ebeveyn önce sıralı. Yedekleme/geri yükleme listeleri
   * (`lib/db/restore.ts`, `lib/actions/backup.ts`) bunu okuyor — listede
   * olmayan bir tablo geri yüklemede eski hâliyle kalır, olmayan projelere ve
   * eklere işaret eden veri bırakırdı.
   */
  tables?: readonly string[];
  /**
   * Modülün referans verdiği attachment id'lerini döndüren bir SELECT. Core'un
   * ek temizliği (`lib/db/attachment-links.ts`) bu id'leri silmez: aksi halde
   * hiçbir issue'ya bağlı olmayan modül görselleri 24 saat sonra yetim sayılıp
   * silinirdi.
   */
  attachmentRefsSql?: string;
}

/**
 * Bir modülün komut paletinde aranabilir kaydı (ör. bir wiki sayfası). Core
 * yalnız bu şekli bilir; kaydı üreten sorgu modülün kendi sunucu kodunda
 * (`lib/modules/server.ts`).
 */
export interface ModuleSearchEntry {
  moduleId: string;
  id: string;
  title: string;
  projectId: string | null;
  href: Route;
}

/**
 * v1: hiç modül yok. Bir modül eklendiğinde buraya bir `ModuleDefinition`
 * eklenir — sidebar, Ayarlar > Modüller sayfası, şema ve proje silme akışı
 * sıfır ek değişiklikle onu keşfeder.
 */
export const MODULE_REGISTRY: ModuleDefinition[] = [];
