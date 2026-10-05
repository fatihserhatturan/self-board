import { cache } from "react";
import { getDb } from "@/lib/db/client";
import { listWikiTreeDb, readWikiPageDb } from "@/lib/modules/wiki/db";

/** Bir projenin sayfa ağacı (gövdesiz). Son düzenlenenler de buradan türetiliyor. */
export const getWikiTree = cache(async function getWikiTree(projectId: string) {
  return listWikiTreeDb(getDb(), projectId);
});

export const getWikiPage = cache(async function getWikiPage(pageId: string) {
  return readWikiPageDb(getDb(), pageId);
});
