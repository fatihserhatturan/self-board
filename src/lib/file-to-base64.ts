/**
 * Bir dosyayı base64 gövdesine çevirir (data URI önekini atarak) — sunucu
 * eylemleri attachment ve proje ikonunu bu biçimde bekliyor. Editör ve proje
 * ayarlarında ayrı ayrı tanımlıydı.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
