"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/components/locale-provider";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

/**
 * Tek onay deseni. Öncesinde silme onayları tutarsızdı: issue ve projede 3
 * saniyelik çift tıklama, view/label/notta hiç onay yok — üstelik bunların
 * hepsi elle cascade siliyor. Kaydedilmemiş değişiklik uyarısı da aynı
 * bileşeni kullanıyor.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = true,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            loading={loading}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
