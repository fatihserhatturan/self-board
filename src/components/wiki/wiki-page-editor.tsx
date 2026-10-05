"use client";

import { useImperativeHandle, useState, type Ref } from "react";
import { RichTextEditor } from "@/components/board/rich-text-editor";
import { RelativeTime } from "@/components/ui/relative-time";
import { useLocale } from "@/components/locale-provider";
import type { TranslationKey } from "@/lib/i18n/types";
import type { WikiPage } from "@/lib/modules/wiki/db";
import { WIKI_TITLE_MAX_LENGTH } from "@/lib/modules/wiki/schema";
import { useWikiAutosave, type WikiSaveStatus } from "@/components/wiki/use-wiki-autosave";

export interface WikiPageEditorHandle {
  flush: () => Promise<void>;
  discard: () => void;
}

export interface WikiPageEditorProps {
  page: WikiPage;
  /** Yeni oluşturulan sayfada imleç başlıkta başlasın. */
  autoFocusTitle?: boolean;
  /** Ağaçtaki başlık kaydı beklemeden güncellensin diye. */
  onTitleChange?: (title: string) => void;
  ref?: Ref<WikiPageEditorHandle>;
}

const STATUS_KEY: Partial<Record<WikiSaveStatus, TranslationKey>> = {
  dirty: "wiki.status.unsaved",
  saving: "wiki.status.saving",
  saved: "wiki.status.saved",
  error: "wiki.status.error",
};

/**
 * Seçili sayfanın başlığı ve içeriği. Çağıran `key={page.id}` veriyor: sayfa
 * değişince editör yeniden kuruluyor.
 *
 * İçerik bağlandığı anda donduruluyor (`useState(page.body)`): her otomatik
 * kayıt rotayı revalidate ettiği için `page` prop'u yeniden geliyor; o
 * değer editöre verilseydi `RichTextEditor` onu son yayınladığı HTML'den
 * farklı görüp `setContent` ile basar, kayıt sürerken yazılanı silerdi.
 * Sunucudan gelen prop'lardan yalnız `updatedAt` kullanılıyor. Aynı gerekçeyle
 * burada `useSyncedState` kullanılmıyor.
 */
export function WikiPageEditor({ page, autoFocusTitle, onTitleChange, ref }: WikiPageEditorProps) {
  const { t } = useLocale();
  const [initialBody] = useState(page.body);
  const [title, setTitle] = useState(page.title);
  const autosave = useWikiAutosave(page.id, { title: page.title, body: page.body });

  useImperativeHandle(ref, () => ({ flush: autosave.flush, discard: autosave.discard }), [
    autosave.flush,
    autosave.discard,
  ]);

  const statusKey = STATUS_KEY[autosave.status];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-10 py-8">
      <div className="flex items-center gap-2 text-mini text-text-tertiary">
        <span>
          {t("wiki.lastEdited")} <RelativeTime iso={page.updatedAt} />
        </span>
        {statusKey && (
          <>
            <span aria-hidden>·</span>
            <span
              role="status"
              className={autosave.status === "error" ? "text-destructive" : undefined}
            >
              {t(statusKey)}
            </span>
          </>
        )}
      </div>

      <input
        value={title}
        maxLength={WIKI_TITLE_MAX_LENGTH}
        autoFocus={autoFocusTitle}
        placeholder={t("common.untitled")}
        aria-label={t("wiki.titleLabel")}
        onChange={(event) => {
          setTitle(event.target.value);
          onTitleChange?.(event.target.value);
          autosave.update({ title: event.target.value });
        }}
        className="w-full bg-transparent text-title2 font-medium text-text-primary outline-none placeholder:text-text-disabled"
      />

      <RichTextEditor
        content={initialBody}
        onChange={(html) => autosave.update({ body: html })}
        placeholder={t("wiki.bodyPlaceholder")}
        variant="document"
      />
    </div>
  );
}
