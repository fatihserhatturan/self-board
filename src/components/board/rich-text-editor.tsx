"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { LinkPreview } from "@/components/board/link-preview-node";
import { uploadAttachment } from "@/lib/actions/attachments";
import { cn } from "@/lib/utils";

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ACCEPTED_TYPES = ACCEPTED_MIME_TYPES.join(",");
const MAX_BYTES = 5 * 1024 * 1024;
const SOLE_URL_PATTERN = /^https?:\/\/\S+$/i;

export interface RichTextEditorProps {
  content: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder,
}: RichTextEditorProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastEmittedContent = useRef(content);
  // `handlePaste` içindeki closure, editor'ün "immediatelyRender: false" nedeniyle
  // ilk render'da null olan hâlini kalıcı olarak yakalıyor (dep'ler değişmediği için
  // yeniden oluşturulmuyor). Güncel editor'e her zaman ref üzerinden erişiyoruz.
  const editorRef = useRef<Editor | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!content);

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
      ],
      editorProps: {
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
    const url = window.prompt(t("markdownEditor.linkPrompt"));
    if (!url) return;

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
      {editable && (
        <div className="flex items-center gap-1">
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("markdownEditor.insertLink")}
            onClick={handleInsertLink}
          >
            <LinkIcon className="size-3.5" />
          </Button>
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
          <span className="pointer-events-none absolute left-3 top-2 text-small text-text-tertiary">
            {placeholder}
          </span>
        )}
        <EditorContent
          editor={editor as Editor}
          className={cn(
            "min-h-16 rounded-md text-small text-text-primary [&_.ProseMirror]:outline-none",
            "[&_p]:my-1 [&_img]:max-w-full [&_img]:max-h-80 [&_img]:rounded-md [&_a]:text-accent [&_a]:underline",
            editable
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
