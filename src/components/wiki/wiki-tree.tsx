"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CornerDownRight,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import { childrenByParent, type WikiTreeNode } from "@/lib/modules/wiki/tree";
import { cn } from "@/lib/utils";

export interface WikiTreeProps {
  nodes: WikiTreeNode[];
  selectedId: string | null;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onMove: (node: WikiTreeNode, direction: "up" | "down") => void;
  onReparent: (node: WikiTreeNode) => void;
  onDelete: (node: WikiTreeNode) => void;
  /** Başlık; seçili sayfada kayıt beklemeden yazılan değer. */
  titleOf: (node: WikiTreeNode) => string;
}

/** Sayfa ağacı. Veri düz bir liste; iç içe yapı `childrenByParent` ile kuruluyor. */
export function WikiTree(props: WikiTreeProps) {
  const childMap = childrenByParent(props.nodes);
  return (
    <ul role="tree" className="flex flex-col gap-px">
      <WikiTreeLevel {...props} parentId={null} depth={0} childMap={childMap} />
    </ul>
  );
}

function WikiTreeLevel(
  props: WikiTreeProps & {
    parentId: string | null;
    depth: number;
    childMap: Map<string | null, WikiTreeNode[]>;
  },
) {
  const siblings = props.childMap.get(props.parentId) ?? [];
  return siblings.map((node, index) => (
    <WikiTreeRow
      key={node.id}
      {...props}
      node={node}
      isFirst={index === 0}
      isLast={index === siblings.length - 1}
    />
  ));
}

function WikiTreeRow(
  props: WikiTreeProps & {
    node: WikiTreeNode;
    depth: number;
    childMap: Map<string | null, WikiTreeNode[]>;
    isFirst: boolean;
    isLast: boolean;
  },
) {
  const { t } = useLocale();
  const { node, depth, childMap, isFirst, isLast } = props;
  const hasChildren = (childMap.get(node.id)?.length ?? 0) > 0;
  const expanded = hasChildren && props.isExpanded(node.id);
  const selected = props.selectedId === node.id;
  const title = props.titleOf(node) || t("common.untitled");

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined} aria-selected={selected}>
      <div
        className={cn(
          "group flex h-7 items-center gap-1 rounded-md pr-1 text-small transition-colors",
          selected ? "bg-bg-muted text-text-primary" : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => props.onToggle(node.id)}
            aria-label={t(expanded ? "wiki.tree.collapse" : "wiki.tree.expand")}
            className="flex size-5 shrink-0 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
          >
            <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <FileText className="mx-0.5 size-3.5 shrink-0 text-text-tertiary" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => props.onSelect(node.id)}
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !props.titleOf(node) && "text-text-tertiary",
          )}
        >
          {title}
        </button>

        {/* Menü açıkken de görünür kalsın — `has-[[data-state=open]]`. */}
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100">
          <Tooltip content={t("wiki.tree.addChild")}>
            <button
              type="button"
              onClick={() => props.onCreateChild(node.id)}
              aria-label={t("wiki.tree.addChild")}
              className="flex size-5 items-center justify-center rounded text-text-tertiary hover:bg-bg-subtle hover:text-text-primary"
            >
              <Plus className="size-3.5" />
            </button>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("wiki.tree.actions")}
              className="flex size-5 items-center justify-center rounded text-text-tertiary hover:bg-bg-subtle hover:text-text-primary"
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onSelect={() => props.onCreateChild(node.id)}>
                <Plus className="size-3.5" /> {t("wiki.tree.addChild")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isFirst} onSelect={() => props.onMove(node, "up")}>
                <ArrowUp className="size-3.5" /> {t("wiki.tree.moveUp")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isLast} onSelect={() => props.onMove(node, "down")}>
                <ArrowDown className="size-3.5" /> {t("wiki.tree.moveDown")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => props.onReparent(node)}>
                <CornerDownRight className="size-3.5" /> {t("wiki.tree.reparent")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => props.onDelete(node)}>
                <Trash2 className="size-3.5" /> {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <ul role="group" className="flex flex-col gap-px">
          <WikiTreeLevel {...props} parentId={node.id} depth={depth + 1} childMap={childMap} />
        </ul>
      )}
    </li>
  );
}
