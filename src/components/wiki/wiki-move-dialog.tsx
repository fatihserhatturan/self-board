"use client";

import { CornerLeftUp, FileText } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/components/locale-provider";
import { pagePath, subtreeIds, type WikiTreeNode } from "@/lib/modules/wiki/tree";

const ROOT_VALUE = "__root__";

export interface WikiMoveDialogProps {
  /** Taşınacak sayfa; `null` iken dialog kapalı. */
  node: WikiTreeNode | null;
  nodes: WikiTreeNode[];
  onOpenChange: (open: boolean) => void;
  /** Yeni üst sayfa; `null` en üst düzey. */
  onSelect: (parentId: string | null) => void;
  titleOf: (node: WikiTreeNode) => string;
}

/**
 * Sayfayı başka bir sayfanın altına taşıma. Sayfanın kendisi ve torunları
 * listede yok (ağaç döngüye girerdi — sunucu da ayrıca reddediyor); şu anki
 * üst sayfa devre dışı. Etiket tam yol: aynı başlıklı iki sayfa ayırt edilsin.
 */
export function WikiMoveDialog({ node, nodes, onOpenChange, onSelect, titleOf }: WikiMoveDialogProps) {
  const { t } = useLocale();
  const excluded = node ? subtreeIds(nodes, node.id) : new Set<string>();
  const candidates = nodes.filter((candidate) => !excluded.has(candidate.id));

  function label(candidate: WikiTreeNode): string {
    return pagePath(nodes, candidate.id)
      .map((part) => titleOf(part) || t("common.untitled"))
      .join(" / ");
  }

  return (
    <Dialog open={node != null} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="gap-0 overflow-hidden p-0">
        <div className="px-4 pt-4">
          <DialogTitle>{t("wiki.move.title")}</DialogTitle>
          <DialogDescription>{t("wiki.move.description")}</DialogDescription>
        </div>
        <Command className="mt-3">
          <CommandInput placeholder={t("wiki.move.placeholder")} />
          <CommandList>
            <CommandEmpty>{t("commandPalette.noResults")}</CommandEmpty>
            <CommandItem
              value={ROOT_VALUE}
              keywords={[t("wiki.move.root")]}
              disabled={node?.parentId === null}
              onSelect={() => onSelect(null)}
            >
              <CornerLeftUp className="size-3.5 text-text-tertiary" />
              {t("wiki.move.root")}
            </CommandItem>
            {candidates.map((candidate) => {
              const text = label(candidate);
              return (
                <CommandItem
                  key={candidate.id}
                  value={candidate.id}
                  keywords={[text]}
                  disabled={candidate.id === node?.parentId}
                  onSelect={() => onSelect(candidate.id)}
                >
                  <FileText className="size-3.5 shrink-0 text-text-tertiary" />
                  <span className="truncate">{text}</span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
