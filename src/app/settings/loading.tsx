import { Skeleton } from "@/components/ui/skeleton";

/**
 * Ayarlar `(app)` grubunun dışında olduğu için oradaki `loading.tsx` bu ağacı
 * kapsamıyor; kabuk (nav) zaten render edilmiş olacağından yalnızca içerik
 * kolonunun iskeleti gösteriliyor.
 */
export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-56 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
