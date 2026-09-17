# self-board

Tek kişilik geliştiriciler için Linear tarzı bir proje yönetim uygulaması. Tarayıcıda
Next.js uygulaması olarak, masaüstünde ise Electron kabuğuyla paketlenmiş olarak çalışır.
Tüm veri makinede, tek bir SQLite dosyasında durur — sunucu, hesap ya da ağ bağlantısı yok.

## Neler var

- **Projeler** — her biri kendi issue ID öneki (`COR-12`), rengi ve ikonu ile.
- **Issue'lar** — durum, öncelik, atanan, etiketler, zengin metin açıklaması (görsel
  yükleme ve bağlantı önizlemesi dahil) ve notlar.
- **Yapılandırılabilir iş akışı** — pano sütunları proje başına tanımlanıyor: ekle, sil,
  yeniden adlandır, sırala, renk ve ikon ata.
- **Liste ve pano görünümü** — gruplama alanı seçilebilir (durum, atanan, öncelik, etiket,
  cycle), panoda sürükle-bırak seçilen alanı değiştirir, her ikisinde sağ tık menüsü var.
- **Cycle'lar** — Linear tarzı otomatik tekrarlayan dönemler, tamamlanmamış issue'ların
  devri, burnup ve hız grafikleri, kapasite ölçeri.
- **Kaydedilmiş görünümler** — filtre ve görünüm ayarlarının adlandırılmış anlık görüntüsü.
- **Türkçe/İngilizce arayüz**, açık/koyu/sistem teması.

## Çalıştırma

```bash
npm install
npm run dev          # http://localhost:3000
npm run electron:dev # Next dev sunucusu + Electron penceresi birlikte
```

Doğrulama:

```bash
npx tsc --noEmit
npm run lint
npm test             # node:test + tsx, saf yardımcıların birim testleri
npm run build
```

## Masaüstü derlemesi

```bash
npm run electron:build
```

`next build` çıktısını standalone sunucu olarak paketler, Electron'un kendi Node
çalışma zamanıyla rastgele bir yerel portta ayağa kaldırır ve kurulum dosyasını
`release/` altına yazar. Paketlenmiş uygulamada veritabanı Electron'un `userData`
dizinindedir (Windows'ta `%APPDATA%/Self Board/self-board.db`).

## Mimari

| Katman | Yer | Not |
| --- | --- | --- |
| Sayfalar | `src/app/(app)/` | Hepsi `force-dynamic`; her istekte SQLite okunur |
| Ayarlar | `src/app/settings/` | `(app)` grubunun dışında: pencereyi devralır, kendi kenar çubuğu vardır |
| Okuma | `src/lib/data/` | React `cache()` ile istek başına tekilleştirilmiş sorgular |
| Yazma | `src/lib/actions/` | Server Action'lar, `ActionResult<T>` döner, `revalidatePath` çağırır |
| Şema | `src/lib/db/schema.ts` | DDL + elle yazılmış ileri yönlü migration'lar |
| Bileşenler | `src/components/ui/` | Radix tabanlı tasarım sistemi |
| Masaüstü | `electron/` | Ana süreç, preload, standalone hazırlama betiği |

Birkaç bilinçli karar:

- **Foreign key'ler zorlanıyor ama cascade'e güvenilmiyor.** `node:sqlite`
  `PRAGMA foreign_keys`'i varsayılan olarak açıyor; var olmayan bir satıra işaret
  eden yazma exception fırlatır. Ancak eski DB'lerde ALTER ile eklenen kolonların
  (ör. `issues.project_id`) `REFERENCES`'ı yok, bazı ilişkilerde de `ON DELETE`
  tanımlı değil. Bu yüzden silme temizliği `src/lib/db/cascade.ts` ve ilgili
  action'larda (`deleteLabel`, `deleteUser`, `deleteWorkflowState`) açıkça, çocuk
  satırlardan başlayarak yapılıyor — yeni bir silme yolu eklerken aynı sırayı izleyin.
- **Girdiler sunucuda doğrulanıyor.** Server Action'lar herkese açık uç noktalar;
  durumun/cycle'ın issue'nun projesine ait olduğu gibi kurallar `src/lib/db/validation.ts`
  içinde. FK kısıtı yalnızca "var olmayan satırı" yakalar, "başka projenin satırını" değil.
- **Şema sürümlü.** `PRAGMA user_version` ile; migration'lar tek transaction içinde
  çalışıyor (`ensureSchema`). Yeni migration `if (version < N)` bloğu olarak eklenir.
- **Durumlar kullanıcı tanımlı, tipler sabit.** `workflow_states` satırları proje başına
  ve serbestçe düzenlenebiliyor, ama her durum beş sabit sistem tipinden birine bağlı
  (`backlog`, `unstarted`, `started`, `completed`, `canceled`). Cycle devri, burnup
  grafiği ve başarı yüzdesi durumun adına değil tipine bakıyor — tip olmasaydı serbest
  sütunlar bu metrikleri anlamsızlaştırırdı. Tipler `src/lib/board/workflow-config.ts`
  içinde. `issues` tablosundaki eski `status` kolonu geçişten sonra bilerek düşürülmedi:
  `CHECK` kısıtlı bir kolonu SQLite'ta kaldırmak tabloyu yeniden yazmayı gerektiriyor.
- **Cycle'lar cron olmadan üretiliyor.** `getCycles()` istek anında bitmiş cycle'ları
  yakalar, tamamlanmamış issue'ları devreder ve günlük snapshot yazar. Yani bir okuma
  yolu yazma yapar; ayrıntılı gerekçe `src/lib/data/cycles.ts` içinde.
- **`src/components/ui/` yalnızca kullanılan bileşenleri içerir.** Ayrı bir tasarım
  sistemi kataloğu yok; bir bileşen uygulamada bir yerde kullanılmıyorsa silinir.
- **Tercihler ikiye ayrılmış.** Sunucunun okuması gerekenler (başlangıç sayfası, yeni
  issue varsayılanları, tarih biçimi) `app_settings` anahtar-değer tablosunda; tipleri
  ve varsayılanları `src/lib/preferences-config.ts` içinde, DB'siz tutuluyor ki client
  bileşenler `node:sqlite`'ı bundle'a çekmesin. Tema ve dil ilk boyamadan önce
  gerektiği için `localStorage`'da kalıyor.
- **Tasarım token'ları** `src/styles/tokens.css` içinde. Koyu tema değerleri Linear'ın
  Figma topluluk dosyasından alınmış; açık tema türetilmiştir.

## Ajanlar için

`AGENTS.md` dosyası `next dev` tarafından yazılır ve bu Next sürümünün eğitim
verisinden farklı olabileceğini hatırlatır. Kod yazmadan önce
`node_modules/next/dist/docs/` altındaki ilgili rehberi okuyun.
