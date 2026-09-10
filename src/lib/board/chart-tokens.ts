/**
 * Grafik serisi renkleri ve işaret ölçüleri.
 *
 * Uygulamanın UI paleti (`--color-label-*`) Linear'ın kendi renklerinden
 * türetildi ve grafik yüzeyinde okunaklılık için fazla açık kalıyor
 * (sarı OKLCH L 0.85, yeşil 0.703, mavi 0.712 — dark mod bandı L 0.48–0.67).
 * Bu yüzden UI paletine dokunmadan, grafiğe özel tonlar türetildi.
 * `dataviz` skill'inin doğrulayıcısı bu üçlüyü hem dark (`#181921`) hem light
 * (`#ffffff`) yüzeyde altı kontrolden de geçiriyor:
 *
 *   node scripts/validate_palette.js "#3fa372,#b8891f,#3d92e8" --mode dark  --surface "#181921"
 *   node scripts/validate_palette.js "#3fa372,#b8891f,#3d92e8" --mode light --surface "#ffffff"
 *
 * En kötü komşu çift kehribar↔yeşil ΔE 8.7 (protan) — hedefin (8) hemen
 * üstünde, bu yüzden ikincil kodlama zorunlu: yığılmış segmentler arasında
 * 2px yüzey boşluğu + doğrudan etiketler + legend.
 *
 * ÖNEMLİ: accent (`#5e6ad2`) ile mavi (`#3d92e8`) normal görüşte ΔE 10.4
 * (15 eşiğinin altında) — aynı grafikte ikisi birlikte seri olarak
 * KULLANILAMAZ. Bu yüzden accent hiçbir grafikte seri rengi değil; sadece
 * UI ölçerlerinde (ilerleme halkası) kullanılıyor. Scope/hedef çizgileri de
 * kimlik rengi taşımaz — nötr gri, çizgi stiliyle ayrışır.
 */
export const CHART_COLORS = {
  completed: "#3fa372",
  started: "#b8891f",
  todo: "#3d92e8",
} as const;

/** Nötr işaretler `currentColor` kullanır; bu sınıflar tema-duyarlı gri sağlar. */
export const CHART_NEUTRAL_CLASS = "text-text-tertiary";
export const CHART_GRID_CLASS = "text-border-default";

/** dataviz işaret ölçüleri (marks-and-anatomy). */
export const CHART_LINE_WIDTH = 2;
export const CHART_MARKER_RADIUS = 4; // ≥ 8px çap
export const CHART_AREA_OPACITY = 0.1; // alan dolgusu: doygun blok değil, yıkama
export const CHART_SEGMENT_GAP = 2; // yığılmış segmentler arası yüzey boşluğu
export const CHART_BAR_RADIUS = 4; // veri ucu yuvarlatması
