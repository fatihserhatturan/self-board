/**
 * Wiki sayfa ağacı üzerinde saf yardımcılar — client (ağaç, taşıma dialog'u),
 * sunucu ve testler aynı kodu kullanıyor. Veri her zaman düz bir liste
 * (`parentId` ile); ağaç yapısı burada türetiliyor.
 */

export interface WikiTreeNode {
  id: string;
  parentId: string | null;
  title: string;
  position: number;
  updatedAt: string;
}

/** Ebeveyn id'si → pozisyona göre sıralı çocuklar. Kökler `null` anahtarında. */
export function childrenByParent(nodes: WikiTreeNode[]): Map<string | null, WikiTreeNode[]> {
  const map = new Map<string | null, WikiTreeNode[]>();
  for (const node of nodes) {
    const list = map.get(node.parentId) ?? [];
    list.push(node);
    map.set(node.parentId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.position - b.position);
  return map;
}

/** Bir sayfanın tüm ataları (kendisi hariç). Bozuk veride döngüye karşı korumalı. */
export function ancestorIds(nodes: WikiTreeNode[], id: string): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const result = new Set<string>();
  let current = byId.get(id)?.parentId ?? null;
  while (current && !result.has(current)) {
    result.add(current);
    current = byId.get(current)?.parentId ?? null;
  }
  return result;
}

/** Bir sayfa ve tüm torunları (kendisi dahil). */
export function subtreeIds(nodes: WikiTreeNode[], id: string): Set<string> {
  const children = childrenByParent(nodes);
  const result = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (result.has(current)) continue;
    result.add(current);
    for (const child of children.get(current) ?? []) stack.push(child.id);
  }
  return result;
}

/** Kökten sayfanın kendisine kadar olan yol — taşıma listesindeki etiket ve breadcrumb. */
export function pagePath(nodes: WikiTreeNode[], id: string): WikiTreeNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path: WikiTreeNode[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

/** Son düzenlenen sayfalar, yeniden eskiye. */
export function recentPages(nodes: WikiTreeNode[], limit = 8): WikiTreeNode[] {
  return [...nodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}
