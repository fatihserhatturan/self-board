/**
 * Global (window seviyesinde) kısayolların metin girişini ele geçirmemesi için
 * hedef kontrolü. Tiptap `contenteditable` bir div kullandığı için `<input>` ve
 * `<textarea>` kontrolü tek başına yetmiyor — ör. açıklama alanında Cmd+I
 * italic yapmalı, cycle panelini açıp kapatmamalı.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
