import type { LabelColor } from "@/lib/actions/labels";

/**
 * Kullanıcının seçebildiği renk kümesi ve Tailwind sınıf eşlemesi. Etiketler ve
 * projeler aynı paleti kullanıyor — daha önce ikisinde birebir aynı iki liste
 * ayrı ayrı tanımlıydı.
 */
export const SELECTABLE_COLORS: LabelColor[] = [
  "teal",
  "red",
  "mustard",
  "yellow",
  "orange",
  "purple",
  "blue",
  "grey",
  "green",
];

/** Dolu renk noktası — üzerinde metin taşımayan küçük göstergeler için. */
export const COLOR_DOT_CLASS: Record<LabelColor, string> = {
  teal: "bg-label-teal",
  red: "bg-label-red",
  mustard: "bg-label-mustard",
  yellow: "bg-label-yellow",
  orange: "bg-label-orange",
  purple: "bg-label-purple",
  blue: "bg-label-blue",
  grey: "bg-label-grey",
  green: "bg-label-green",
};

/** Rengin metin/ikon karşılığı — durum ikonları bunu kullanıyor. */
export const COLOR_TEXT_CLASS: Record<LabelColor, string> = {
  teal: "text-label-teal",
  red: "text-label-red",
  mustard: "text-label-mustard",
  yellow: "text-label-yellow",
  orange: "text-label-orange",
  purple: "text-label-purple",
  blue: "text-label-blue",
  grey: "text-label-grey",
  green: "text-label-green",
};

/**
 * Tonlu zemin + aynı renkte metin. Üzerinde yazı taşıyan renkli yüzeyler
 * (proje ikonu baş harfi) bunu kullanır: dolu renk üzerine beyaz metin, parlak
 * etiket renklerinde koyu temada 1.59–2.63:1 gibi okunmaz değerler veriyordu.
 * `avatar.tsx` baştan beri bu deseni kullanıyor.
 */
export const COLOR_TINT_CLASS: Record<LabelColor, string> = {
  teal: "bg-label-teal/20 text-label-teal",
  red: "bg-label-red/20 text-label-red",
  mustard: "bg-label-mustard/20 text-label-mustard",
  yellow: "bg-label-yellow/20 text-label-yellow",
  orange: "bg-label-orange/20 text-label-orange",
  purple: "bg-label-purple/20 text-label-purple",
  blue: "bg-label-blue/20 text-label-blue",
  grey: "bg-label-grey/20 text-label-grey",
  green: "bg-label-green/20 text-label-green",
};
