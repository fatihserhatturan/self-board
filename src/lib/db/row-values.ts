/**
 * `node:sqlite` satırlarını `Record<string, unknown>` olarak döndürüyor; her
 * `lib/data/*` dosyası bu iki dönüştürücüyü kendi içinde yeniden tanımlıyordu.
 */
export function asString(value: unknown): string {
  return String(value);
}

export function asNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}
