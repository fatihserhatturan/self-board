"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import { WikiHome } from "@/components/wiki/wiki-home";
import { WikiMoveDialog } from "@/components/wiki/wiki-move-dialog";
import { WikiPageEditor, type WikiPageEditorHandle } from "@/components/wiki/wiki-page-editor";
import { WikiTree } from "@/components/wiki/wiki-tree";
import {
  createWikiPage,
  deleteWikiPage,
  moveWikiPage,
  reparentWikiPage,
} from "@/lib/modules/wiki/actions";
import type { WikiPage } from "@/lib/modules/wiki/db";
import { ancestorIds, subtreeIds, type WikiTreeNode } from "@/lib/modules/wiki/tree";

export interface WikiViewProps {
  projectId: string;
  projectName: string;
  pages: WikiTreeNode[];
  selectedPage: WikiPage | null;
}

/**
 * Wiki ekranı: solda sayfa ağacı, sağda seçili sayfa (ya da son düzenlenenler).
 * Seçim URL'de (`?page=`); `?page=` değişince bu bileşen yeniden kurulmuyor,
 * yalnız editör (`key={page.id}`). Her gezinmeden önce editörün bekleyen kaydı
 * yazılıyor (`flush`).
 */
export function WikiView({ projectId, projectName, pages, selectedPage }: WikiViewProps) {
  const { t } = useLocale();
  const router = useRouter();
  const editorRef = useRef<WikiPageEditorHandle>(null);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [liveTitle, setLiveTitle] = useState<{ id: string; title: string } | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [moving, setMoving] = useState<WikiTreeNode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WikiTreeNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedId = selectedPage?.id ?? null;
  // Seçili sayfanın ataları varsayılan olarak açık; kullanıcının açıp
  // kapattıkları `toggled`'da ve önceliği var.
  const ancestors = useMemo(
    () => (selectedId ? ancestorIds(pages, selectedId) : new Set<string>()),
    [pages, selectedId],
  );
  const isExpanded = (id: string) => toggled[id] ?? ancestors.has(id);
  // Seçili sayfanın başlığı ağaçta kayıt beklemeden güncelleniyor.
  const titleOf = (node: WikiTreeNode) =>
    liveTitle?.id === node.id ? liveTitle.title : node.title;

  function hrefFor(pageId: string | null) {
    return pageId ? `/wiki?project=${projectId}&page=${pageId}` : `/wiki?project=${projectId}`;
  }

  async function openPage(pageId: string | null) {
    if (pageId === selectedId) return;
    await editorRef.current?.flush();
    router.push(hrefFor(pageId));
  }

  async function create(parentId: string | null) {
    if (creating) return;
    setCreating(true);
    try {
      await editorRef.current?.flush();
      const result = await createWikiPage(projectId, parentId);
      if (!result.ok) {
        toast.error(t("wiki.createError"));
        return;
      }
      if (parentId) setToggled((prev) => ({ ...prev, [parentId]: true }));
      setJustCreatedId(result.data.id);
      router.push(hrefFor(result.data.id));
    } catch {
      toast.error(t("wiki.createError"));
    } finally {
      setCreating(false);
    }
  }

  async function move(node: WikiTreeNode, direction: "up" | "down") {
    try {
      const result = await moveWikiPage(node.id, direction);
      if (!result.ok) toast.error(t("wiki.updateError"));
    } catch {
      toast.error(t("wiki.updateError"));
    }
  }

  async function reparent(parentId: string | null) {
    const node = moving;
    setMoving(null);
    if (!node) return;
    try {
      const result = await reparentWikiPage(node.id, parentId);
      if (!result.ok) {
        toast.error(t("wiki.updateError"));
        return;
      }
      if (parentId) setToggled((prev) => ({ ...prev, [parentId]: true }));
    } catch {
      toast.error(t("wiki.updateError"));
    }
  }

  const deleteCount = pendingDelete ? subtreeIds(pages, pendingDelete.id).size - 1 : 0;

  async function confirmDelete() {
    const node = pendingDelete;
    if (!node) return;
    const removed = subtreeIds(pages, node.id);
    const selectedRemoved = selectedId !== null && removed.has(selectedId);
    // Silinecek sayfaya bekleyen kayıt gitmesin.
    if (selectedRemoved) editorRef.current?.discard();

    setDeleting(true);
    try {
      const result = await deleteWikiPage(node.id);
      if (!result.ok) {
        toast.error(t("wiki.deleteError"));
        return;
      }
      toast.success(t("wiki.deleted"));
      // Silinen alt ağacın üst sayfası silinmedi; açık sayfa gittiyse oraya düşülüyor.
      if (selectedRemoved) router.replace(hrefFor(node.parentId));
    } catch {
      toast.error(t("wiki.deleteError"));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <TopBar
        title={t("nav.wiki")}
        breadcrumb={projectName}
        primaryActionLabel={t("wiki.newPage")}
        onPrimaryAction={() => void create(null)}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border-default">
          <div className="flex items-center justify-between py-2 pl-4 pr-2">
            <button
              type="button"
              onClick={() => void openPage(null)}
              className="text-micro font-medium uppercase tracking-wide text-text-tertiary transition-colors hover:text-text-primary"
            >
              {t("wiki.pages")}
            </button>
            <Tooltip content={t("wiki.newPage")}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("wiki.newPage")}
                disabled={creating}
                onClick={() => void create(null)}
              >
                <Plus className="size-3.5" />
              </Button>
            </Tooltip>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-2 pb-3">
              {pages.length === 0 ? (
                <p className="px-2 text-mini text-text-tertiary">{t("wiki.tree.empty")}</p>
              ) : (
                <WikiTree
                  nodes={pages}
                  selectedId={selectedId}
                  isExpanded={isExpanded}
                  onToggle={(id) => setToggled((prev) => ({ ...prev, [id]: !isExpanded(id) }))}
                  onSelect={(id) => void openPage(id)}
                  onCreateChild={(parentId) => void create(parentId)}
                  onMove={(node, direction) => void move(node, direction)}
                  onReparent={setMoving}
                  onDelete={setPendingDelete}
                  titleOf={titleOf}
                />
              )}
            </div>
          </ScrollArea>
        </aside>

        <ScrollArea className="min-h-0 flex-1">
          {selectedPage ? (
            <WikiPageEditor
              key={selectedPage.id}
              ref={editorRef}
              page={selectedPage}
              autoFocusTitle={selectedPage.id === justCreatedId}
              onTitleChange={(title) => setLiveTitle({ id: selectedPage.id, title })}
            />
          ) : (
            <WikiHome
              nodes={pages}
              onOpen={(id) => void openPage(id)}
              onCreate={() => void create(null)}
              titleOf={titleOf}
            />
          )}
        </ScrollArea>
      </div>

      <WikiMoveDialog
        node={moving}
        nodes={pages}
        titleOf={titleOf}
        onOpenChange={(open) => {
          if (!open) setMoving(null);
        }}
        onSelect={(parentId) => void reparent(parentId)}
      />

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("wiki.deleteDialog.title")}
        description={
          deleteCount > 0
            ? `${t("wiki.deleteDialog.description")} ${deleteCount} ${t("wiki.deleteDialog.descendants")}`
            : t("wiki.deleteDialog.description")
        }
        confirmLabel={t("common.delete")}
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
