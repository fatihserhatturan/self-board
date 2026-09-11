# self-board

Tek kişilik geliştiriciler için Linear tarzı bir proje yönetim uygulaması. Tarayıcıda
Next.js uygulaması olarak, masaüstünde ise Electron kabuğuyla paketlenmiş olarak çalışır.
Tüm veri makinede, tek bir SQLite dosyasında durur — sunucu, hesap ya da ağ bağlantısı yok.

## Neler var

- **Projeler** — her biri kendi issue ID öneki (`COR-12`), rengi ve ikonu ile.
- **Issue'lar** — durum, öncelik, atanan, etiketler, zengin metin açıklaması (görsel
  yükleme ve bağlantı önizlemesi dahil) ve notlar.
- **Liste ve pano görünümü** — panoda sürükle-bırak ile durum değiştirme, her ikisinde
  sağ tık menüsüyle hızlı durum/öncelik değişikliği.
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
| Okuma | `src/lib/data/` | React `cache()` ile istek başına tekilleştirilmiş sorgular |
| Yazma | `src/lib/actions/` | Server Action'lar, `ActionResult<T>` döner, `revalidatePath` çağırır |
| Şema | `src/lib/db/schema.ts` | DDL + elle yazılmış ileri yönlü migration'lar |
| Bileşenler | `src/components/ui/` | Radix tabanlı tasarım sistemi |
| Masaüstü | `electron/` | Ana süreç, preload, standalone hazırlama betiği |

Birkaç bilinçli karar:

- **`PRAGMA foreign_keys` açılmıyor.** Cascade silmeler sunucu eylemlerinde elle
  yapılıyor (`deleteIssue`, `deleteProject`, `deleteLabel`). Şema `REFERENCES`
  tanımlıyor ama uygulanmıyor — yeni bir silme yolu eklerken temizliği elle yazmak gerekir.
- **Cycle'lar cron olmadan üretiliyor.** `getCycles()` istek anında bitmiş cycle'ları
  yakalar, tamamlanmamış issue'ları devreder ve günlük snapshot yazar. Yani bir okuma
  yolu yazma yapar; ayrıntılı gerekçe `src/lib/data/cycles.ts` içinde.
- **`/design-system`** tasarım sistemi kataloğudur ve yalnızca geliştirme derlemesinde
  açıktır. Uygulamada henüz kullanılmayan bazı bileşenler (hover card, date picker,
  toggle group, alert, progress) burada yaşar ve bilerek tutulur.
- **Tasarım token'ları** `src/styles/tokens.css` içinde. Koyu tema değerleri Linear'ın
  Figma topluluk dosyasından alınmış; açık tema türetilmiştir.

## Ajanlar için

`AGENTS.md` dosyası `next dev` tarafından yazılır ve bu Next sürümünün eğitim
verisinden farklı olabileceğini hatırlatır. Kod yazmadan önce
`node_modules/next/dist/docs/` altındaki ilgili rehberi okuyun.
