"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import {
  Bold,
  Code,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { useLocale } from "@/components/locale-provider";
import { LinkPreview } from "@/components/board/link-preview-node";
import {
  createIssueRefController,
  issueRefPluginKey,
  type IssueRefOptions,
} from "@/components/board/issue-ref-extension";
import { uploadAttachment } from "@/lib/actions/attachments";
import { fileToBase64 } from "@/lib/file-to-base64";
import { cn } from "@/lib/utils";

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ACCEPTED_TYPES = ACCEPTED_MIME_TYPES.join(",");
const MAX_BYTES = 5 * 1024 * 1024;
const SOLE_URL_PATTERN = /^https?:\/\/\S+$/i;

/** Araç çubuğundaki tek bir biçimlendirme düğmesi. */
function MarkToggle({
  label,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Toggle
      size="sm"
      aria-label={label}
      title={label}
      pressed={active}
      onPressedChange={onToggle}
      className="px-1.5"
    >
      <Icon className="size-3.5" />
    </Toggle>
  );
}

export interface RichTextEditorProps {
  content: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  /**
   * "field": form içinde kenarlıklı alan (issue açıklaması, not). "document":
   * tüm paneli kaplayan uzun metin (wiki sayfası) — kenarlıksız, araç çubuğu
   * kaydırırken üstte kalıyor.
   */
  variant?: "field" | "document";
  /**
   * Verilirse metindeki issue kimlikleri (`COR-12`) bağlantı gibi görünür ve
   * Ctrl/⌘ + tık ile açılır. İlk render'da verilmiş olmalı (eklenti editör
   * kurulurken ekleniyor); değeri sonradan değişebilir.
   */
  issueRefs?: IssueRefOptions;
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder,
  variant = "field",
  issueRefs,
}: RichTextEditorProps) {
  const isDocument = variant === "document";
  // Eklenti editörle bir kez kuruluyor; güncel seçenekleri denetleyici taşıyor.
  const [issueRefController] = useState(() =>
    issueRefs ? createIssueRefController(issueRefs) : null,
  );
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastEmittedContent = useRef(content);
  // `handlePaste` içindeki closure, editor'ün "immediatelyRender: false" nedeniyle
  // ilk render'da null olan hâlini kalıcı olarak yakalıyor (dep'ler değişmediği için
  // yeniden oluşturulmuyor). Güncel editor'e her zaman ref üzerinden erişiyoruz.
  const editorRef = useRef<Editor | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!content);
  // `window.prompt()` Electron renderer'ında desteklenmiyor (paketlenmiş
  // uygulamada link ekleme sessizce çalışmıyordu) — yerine küçük bir popover.
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      content,
      extensions: [
        StarterKit.configure({ link: false }),
        TiptapImage,
        TiptapLink.configure({
          autolink: true,
          openOnClick: !editable,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        }),
        LinkPreview,
        ...(issueRefController ? [issueRefController.extension] : []),
      ],
      editorProps: {
        // Düzenlenebilir editörde linke düz tık imleci koyuyor (`openOnClick`
        // kapalı); Ctrl/⌘ + tık açıyor. Wiki hep düzenlenebilir olduğu için
        // aksi halde içindeki linkler hiç açılamazdı. Electron bu pencereyi
        // harici tarayıcıya yönlendiriyor.
        handleClick: (view, _pos, event) => {
          if (!view.editable || !(event.metaKey || event.ctrlKey)) return false;
          const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
          const href = anchor?.getAttribute("href");
          if (!href) return false;
          event.preventDefault();
          window.open(href, "_blank", "noopener,noreferrer");
          return true;
        },
        handlePaste: (view, event) => {
          const clipboardData = event.clipboardData;
          const imageFile =
            Array.from(clipboardData?.items ?? [])
              .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
              .map((item) => item.getAsFile())
              .find((file): file is File => file !== null) ??
            Array.from(clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"));

          if (imageFile) {
            event.preventDefault();
            void uploadAndInsertImage(imageFile);
            return true;
          }

          const text = event.clipboardData?.getData("text/plain")?.trim();
          if (text && SOLE_URL_PATTERN.test(text)) {
            const { $from } = view.state.selection;
            const isEmptyParagraph =
              $from.parent.type.name === "paragraph" && $from.parent.content.size === 0;
            if (isEmptyParagraph) {
              const node = view.state.schema.nodes.linkPreview.create({ url: text });
              view.dispatch(view.state.tr.replaceSelectionWith(node));
              return true;
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor: instance }) => {
        const html = instance.getHTML();
        lastEmittedContent.current = html;
        setIsEmpty(instance.isEmpty);
        onChange?.(html);
      },
      onCreate: ({ editor: instance }) => setIsEmpty(instance.isEmpty),
    },
    [editable],
  );

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Issue listesi değişince (yeni issue, silinen issue) bağlantılar belgeye
  // dokunmadan yeniden hesaplanıyor.
  useEffect(() => {
    if (!issueRefController) return;
    issueRefController.setOptions(issueRefs);
    // Bağlanmadan önce `isDestroyed` true; eklenti zaten kurulumda güncel değeri okuyor.
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr.setMeta(issueRefPluginKey, true));
  }, [issueRefs, editor, issueRefController]);

  // Tiptap v3'te `useEditor` her transaction'da yeniden render ETMİYOR; araç
  // çubuğunun aktif durumları bu abonelik olmadan imleçle güncellenmezdi.
  const activeMarks = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance?.isActive("bold") ?? false,
      italic: instance?.isActive("italic") ?? false,
      strike: instance?.isActive("strike") ?? false,
      code: instance?.isActive("code") ?? false,
      heading: instance?.isActive("heading", { level: 2 }) ?? false,
      bulletList: instance?.isActive("bulletList") ?? false,
      orderedList: instance?.isActive("orderedList") ?? false,
      blockquote: instance?.isActive("blockquote") ?? false,
    }),
  });

  useEffect(() => {
    if (editor && content !== lastEmittedContent.current) {
      editor.commands.setContent(content);
      lastEmittedContent.current = content;
      setIsEmpty(editor.isEmpty);
    }
  }, [content, editor]);

  async function uploadAndInsertImage(file: File) {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error(t("markdownEditor.unsupportedType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("markdownEditor.fileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadAttachment(base64, file.type);
      if (!result.ok) {
        toast.error(t("markdownEditor.uploadError"));
        return;
      }
      currentEditor.chain().focus().setImage({ src: result.data.url }).run();
    } catch (error) {
      console.error("Resim yüklenirken hata oluştu:", error);
      toast.error(t("markdownEditor.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadAndInsertImage(file);
  }

  function handleInsertLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) return;
    setLinkOpen(false);
    setLinkUrl("");

    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: t("markdownEditor.linkLabelPlaceholder"),
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {editable && editor && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-1",
            isDocument && "sticky top-0 z-10 -mx-1 border-b border-border-default bg-bg-app px-1 py-1.5",
          )}
        >
          {/* StarterKit bu işaretlemelerin hepsini destekliyordu ama arayüzde
              yalnızca resim ve link butonu vardı — kalanı ancak klavye
              kısayoluyla erişilebiliyordu. */}
          <MarkToggle
            label={t("editor.bold")}
            icon={Bold}
            active={activeMarks?.bold ?? false}
            onToggle={() => editor.chain().focus().toggleBold().run()}
          />
          <MarkToggle
            label={t("editor.italic")}
            icon={Italic}
            active={activeMarks?.italic ?? false}
            onToggle={() => editor.chain().focus().toggleItalic().run()}
          />
          <MarkToggle
            label={t("editor.strike")}
            icon={Strikethrough}
            active={activeMarks?.strike ?? false}
            onToggle={() => editor.chain().focus().toggleStrike().run()}
          />
          <MarkToggle
            label={t("editor.code")}
            icon={Code}
            active={activeMarks?.code ?? false}
            onToggle={() => editor.chain().focus().toggleCode().run()}
          />
          <span className="mx-0.5 h-4 w-px bg-border-default" aria-hidden />
          <MarkToggle
            label={t("editor.heading")}
            icon={Heading2}
            active={activeMarks?.heading ?? false}
            onToggle={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <MarkToggle
            label={t("editor.bulletList")}
            icon={List}
            active={activeMarks?.bulletList ?? false}
            onToggle={() => editor.chain().focus().toggleBulletList().run()}
          />
          <MarkToggle
            label={t("editor.orderedList")}
            icon={ListOrdered}
            active={activeMarks?.orderedList ?? false}
            onToggle={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <MarkToggle
            label={t("editor.quote")}
            icon={Quote}
            active={activeMarks?.blockquote ?? false}
            onToggle={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <span className="mx-0.5 h-4 w-px bg-border-default" aria-hidden />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("markdownEditor.insertImage")}
            disabled={uploading}
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="size-3.5" />
          </Button>
          <Popover
            open={linkOpen}
            onOpenChange={(next) => {
              setLinkOpen(next);
              if (!next) setLinkUrl("");
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("markdownEditor.insertLink")}
              >
                <LinkIcon className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <div className="flex flex-col gap-2">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder={t("markdownEditor.linkPrompt")}
                  aria-label={t("markdownEditor.linkPrompt")}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInsertLink();
                    }
                  }}
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  className="self-end"
                  disabled={!linkUrl.trim()}
                  onClick={handleInsertLink}
                >
                  {t("markdownEditor.insertLink")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      )}
      <div className="relative">
        {isEmpty && placeholder && (
          <span
            className={cn(
              "pointer-events-none absolute text-text-tertiary",
              isDocument ? "left-0 top-3 text-normal" : "left-3 top-2 text-small",
            )}
          >
            {placeholder}
          </span>
        )}
        <EditorContent
          editor={editor as Editor}
          className={cn(
            "rounded-md text-text-primary [&_.ProseMirror]:outline-none",
            isDocument
              ? "text-normal [&_.ProseMirror]:min-h-[50vh]"
              : "min-h-16 text-small",
            "[&_p]:my-1 [&_img]:max-w-full [&_img]:max-h-80 [&_img]:rounded-md [&_a]:text-accent [&_a]:underline",
            // Tailwind preflight liste ve başlık stillerini sıfırlıyor: madde
            // işaretleri, numaralar ve başlık boyutları burada geri veriliyor —
            // aksi halde bir madde listesi düz paragraf gibi görünüyordu.
            "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
            "[&_h1]:mb-1 [&_h1]:mt-3 [&_h1]:text-title3 [&_h1]:font-medium",
            "[&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-large [&_h2]:font-medium",
            "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-normal [&_h3]:font-medium",
            "[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary",
            "[&_code]:rounded [&_code]:bg-bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-mini",
            "[&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_hr]:my-3 [&_hr]:border-border-default",
            "[&_.issue-ref]:cursor-pointer [&_.issue-ref]:text-accent [&_.issue-ref]:underline [&_.issue-ref]:decoration-dotted [&_.issue-ref]:underline-offset-2",
            isDocument
              ? "px-0 py-3"
              : editable
                ? "border border-border-default bg-bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]"
                : "px-0 py-0",
          )}
        />
      </div>
    </div>
  );
}

/** Tiptap boş bir doküman için bile `"<p></p>"` üretir; düz `.trim()` bunu yakalayamaz. */
export function isRichTextEmpty(html: string): boolean {
  if (!html) return true;
  const hasText = html.replace(/<[^>]*>/g, "").trim().length > 0;
  if (hasText) return false;
  return !/<img[\s>]/i.test(html) && !/data-type="link-preview"/i.test(html);
}
