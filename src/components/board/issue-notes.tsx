"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { isRichTextEmpty, RichTextEditor } from "@/components/board/rich-text-editor";
import { addIssueNote, deleteIssueNote, getIssueNotes } from "@/lib/actions/issue-notes";
import { useDateFormatter } from "@/lib/use-date-formatter";
import type { IssueNote } from "@/lib/data/issue-notes";

export interface IssueNotesProps {
  issueId: string;
}

export function IssueNotes({ issueId }: IssueNotesProps) {
  const { t } = useLocale();
  const [notes, setNotes] = useState<IssueNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [prevIssueId, setPrevIssueId] = useState(issueId);

  if (issueId !== prevIssueId) {
    setPrevIssueId(issueId);
    setNotes([]);
    setLoaded(false);
  }

  useEffect(() => {
    let cancelled = false;
    getIssueNotes(issueId).then((data) => {
      if (!cancelled) {
        setNotes(data);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  const { formatDateTime } = useDateFormatter();

  async function handleAdd() {
    if (isRichTextEmpty(draft)) return;
    setSubmitting(true);
    const result = await addIssueNote(issueId, draft);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(t("issueNotes.addError"));
      return;
    }
    setNotes((prev) => [...prev, result.data]);
    setDraft("");
  }

  async function handleDelete(noteId: string) {
    setPendingDeleteId(null);
    const previous = notes;
    setNotes((current) => current.filter((note) => note.id !== noteId));
    const result = await deleteIssueNote(noteId);
    if (!result.ok) {
      setNotes(previous);
      toast.error(t("issueNotes.deleteError"));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-small font-medium text-text-primary">{t("issueNotes.title")}</span>

      {!loaded && (
        <div className="flex flex-col gap-2" role="status" aria-label={t("common.loading")}>
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      )}

      {loaded && notes.length === 0 && (
        <p className="text-mini text-text-tertiary">{t("issueNotes.empty")}</p>
      )}

      {notes.length > 0 && (
        <ScrollArea className="max-h-56 rounded-md border border-border-default">
          <div className="flex flex-col divide-y divide-border-default">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <RichTextEditor content={note.body} editable={false} />
                  <span className="text-mini text-text-tertiary">
                    {formatDateTime(new Date(note.createdAt))}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("issueNotes.delete.label")}
                  onClick={() => setPendingDeleteId(note.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex flex-col gap-2">
        <RichTextEditor
          content={draft}
          onChange={setDraft}
          placeholder={t("issueNotes.placeholder")}
        />
        <Button
          size="sm"
          className="self-end"
          onClick={handleAdd}
          loading={submitting}
          disabled={isRichTextEmpty(draft)}
        >
          {t("issueNotes.add")}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDeleteId != null}
        onOpenChange={(next) => {
          if (!next) setPendingDeleteId(null);
        }}
        title={t("confirm.deleteNote.title")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (pendingDeleteId) void handleDelete(pendingDeleteId);
        }}
      />
    </div>
  );
}
