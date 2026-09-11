import { PageSkeleton } from "@/components/ui/page-skeleton";

/**
 * `(app)` altındaki tüm route'lar için tek Suspense sınırı — hepsi
 * `force-dynamic` ve istek anında SQLite okuduğu için navigasyon anında
 * görünür bir geri bildirim gerekiyor (Next 16: dinamik route'larda
 * `loading` dosyası kısmi prefetch'i ve anında geçişi de açıyor).
 */
export default function AppLoading() {
  return <PageSkeleton />;
}
