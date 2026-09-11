import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Projenin yazı tipi ölçeği özel adlar kullanıyor (`globals.css` içindeki
 * `@theme inline` bloğundaki `--text-*` anahtarları). tailwind-merge kendi
 * varsayılan ölçeğini tişört bedenleriyle tanıdığı için (`text-sm`, `text-lg`)
 * `text-mini` ya da `text-small` gibi adları yazı boyutu değil METİN RENGİ
 * sanıyordu — ve aynı gruptan yalnızca sonuncuyu bıraktığı için, boyut ve renk
 * birlikte verildiğinde biri sessizce siliniyordu.
 *
 * Somut etkisi: `<Button size="sm">` sınıf zinciri `... text-text-on-accent ...
 * text-mini` ile bitiyor, renk düşüyor ve düğme yazısı gövdeden miras alıyordu.
 * Koyu temada miras alınan renk zaten beyaza yakın olduğu için görünmüyordu;
 * aydınlık temada siyah çıkıyordu. Aynı çakışma rozetlerde (etiket rengi
 * düşüyordu), proje ikonunda, `Kbd`'de ve sekme başlıklarında da vardı.
 *
 * Ölçeği burada tanıtmak hepsini birden kapatıyor. Yeni bir `--text-*` tokeni
 * eklenirse buraya da eklenmeli.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "micro",
            "mini",
            "small",
            "normal",
            "large",
            // `globals.css` içindeki `@layer utilities` özel yardımcısı.
            "large-medium",
            "title1",
            "title2",
            "title3",
            "issue-title",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
