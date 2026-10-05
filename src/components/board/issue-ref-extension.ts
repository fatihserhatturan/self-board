import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findIssueRefs } from "@/lib/issue-refs";

export interface IssueRefOptions {
  /** Var olan bir issue ise başlığı ve projesi; yoksa `undefined` (bağlantı gösterilmez). */
  resolve: (id: string) => { title: string; projectId: string } | undefined;
  open: (id: string) => void;
  /** Üzerine gelince görünen ipucu ("Ctrl/⌘ + tıkla"). */
  hint: string;
}

/**
 * Bu anahtarla meta taşıyan adımsız bir transaction dekorasyonları yeniden
 * kuruyor — issue listesi değiştiğinde (ör. yeni issue) belgeye dokunmadan.
 * Adımsız olduğu için ne `onUpdate`'i tetikliyor ne geri alma geçmişine giriyor.
 */
export const issueRefPluginKey = new PluginKey<DecorationSet>("issueRefs");

function buildDecorations(
  doc: ProseMirrorNode,
  options: IssueRefOptions | undefined,
): DecorationSet {
  if (!options) return DecorationSet.empty;
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    // Kod içindeki bir kimlik bir referans değil, kod.
    if (node.type.name === "codeBlock") return false;
    if (!node.isText || !node.text) return;
    if (node.marks.some((mark) => mark.type.name === "code" || mark.type.name === "link")) return;

    for (const match of findIssueRefs(node.text)) {
      const issue = options.resolve(match.id);
      if (!issue) continue;
      decorations.push(
        Decoration.inline(pos + match.from, pos + match.to, {
          class: "issue-ref",
          "data-issue-ref": match.id,
          title: `${match.id} · ${issue.title} — ${options.hint}`,
        }),
      );
    }
  });
  return DecorationSet.create(doc, decorations);
}

/**
 * Metindeki issue kimliklerini (`COR-12`) bağlantı gibi gösterir. Saklanan
 * HTML DEĞİŞMİYOR — yalnız görüntüde süsleme (decoration), eski içerik de
 * kendiliğinden bağlantılanıyor, issue silinince bağlantı da kayboluyor.
 *
 * Düzenlenebilir editörde düz tık imleci koyuyor (metni düzeltebilmek için),
 * Ctrl/⌘ + tık issue'yu açıyor; salt okunurda düz tık yeterli.
 *
 * Tiptap eklentileri editör kurulurken sabitleniyor; sonradan gelen seçenekler
 * (ör. değişen issue listesi) `setOptions` ile denetleyicinin içinde
 * güncelleniyor, eklenti her kullanımda güncel değeri okuyor.
 */
export interface IssueRefController {
  extension: Extension;
  setOptions: (next: IssueRefOptions | undefined) => void;
}

export function createIssueRefController(initial: IssueRefOptions): IssueRefController {
  let current: IssueRefOptions | undefined = initial;
  return {
    extension: createIssueRefExtension(() => current),
    setOptions: (next) => {
      current = next;
    },
  };
}

function createIssueRefExtension(getOptions: () => IssueRefOptions | undefined): Extension {
  return Extension.create({
    name: "issueRefs",
    addProseMirrorPlugins() {
      return [
        new Plugin<DecorationSet>({
          key: issueRefPluginKey,
          state: {
            init: (_config, state) => buildDecorations(state.doc, getOptions()),
            apply: (tr, previous, _oldState, newState) =>
              tr.docChanged || tr.getMeta(issueRefPluginKey)
                ? buildDecorations(newState.doc, getOptions())
                : previous,
          },
          props: {
            decorations: (state) => issueRefPluginKey.getState(state),
            handleClick: (view, _pos, event) => {
              const target = event.target instanceof Element ? event.target.closest("[data-issue-ref]") : null;
              if (!target) return false;
              if (view.editable && !(event.metaKey || event.ctrlKey)) return false;
              const id = target.getAttribute("data-issue-ref");
              const options = getOptions();
              if (!id || !options) return false;
              event.preventDefault();
              options.open(id);
              return true;
            },
          },
        }),
      ];
    },
  });
}
