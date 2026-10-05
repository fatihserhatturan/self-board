"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { saveWikiPage } from "@/lib/modules/wiki/actions";

export interface WikiContent {
  title: string;
  body: string;
}

export type WikiSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/** Yazmayı bıraktıktan sonra bekleme. */
const DEBOUNCE_MS = 800;
/** Kesintisiz yazarken bile en geç bu kadar sürede bir kaydediliyor. */
const MAX_WAIT_MS = 5_000;

function sameContent(a: WikiContent, b: WikiContent): boolean {
  return a.title === b.title && a.body === b.body;
}

export interface WikiAutosave {
  status: WikiSaveStatus;
  update: (patch: Partial<WikiContent>) => void;
  /** Bekleyen değişikliği hemen yazar. Sayfa değiştirmeden önce çağrılıyor. */
  flush: () => Promise<void>;
  /** Bekleyen değişikliği atar — silinmek üzere olan sayfaya kayıt gitmesin. */
  discard: () => void;
}

/**
 * Bir wiki sayfasının otomatik kaydı. Kaynak hep yerel `latest`; sunucudan
 * gelen içerik yalnız başlangıç değeri (bkz. `wiki-page-editor.tsx`).
 *
 * - `lastSent` gönderilmeden ÖNCE güncelleniyor: aynı içerik ikinci kez
 *   gönderilmiyor; hata olursa eski değere dönüyor ve bir sonraki değişiklikte
 *   yeniden deneniyor.
 * - Hata toast'ı ardışık hatalarda bir kez — her tuşta yeni bir toast çıkmasın.
 * - Unmount'ta ve sekme/pencere gizlenince bekleyen kayıt yazılıyor.
 *   `beforeunload` ile kapanışı engellemiyoruz: Electron'da bu pencereyi
 *   sessizce açık tutuyor. Kapanışta en fazla ~800 ms'lik yazım kaybolabilir.
 * - Server action'lar istemci başına sırayla gidiyor; kayıtlar birbirini ezmiyor.
 */
export function useWikiAutosave(pageId: string, initial: WikiContent): WikiAutosave {
  const { t } = useLocale();
  const [status, setStatus] = useState<WikiSaveStatus>("idle");
  const latest = useRef(initial);
  const lastSent = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtySince = useRef<number | null>(null);
  const errorShown = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    clearTimer();
    dirtySince.current = null;
    const snapshot = latest.current;
    if (sameContent(snapshot, lastSent.current)) return;

    const previous = lastSent.current;
    lastSent.current = snapshot;
    setStatus("saving");
    try {
      const result = await saveWikiPage(pageId, snapshot);
      if (!result.ok) throw new Error(result.error);
      errorShown.current = false;
      setStatus(sameContent(latest.current, snapshot) ? "saved" : "dirty");
    } catch {
      lastSent.current = previous;
      setStatus("error");
      if (!errorShown.current) {
        errorShown.current = true;
        toast.error(t("wiki.saveError"));
      }
    }
  }, [pageId, clearTimer, t]);

  const update = useCallback(
    (patch: Partial<WikiContent>) => {
      latest.current = { ...latest.current, ...patch };
      if (sameContent(latest.current, lastSent.current)) {
        clearTimer();
        dirtySince.current = null;
        setStatus("saved");
        return;
      }
      setStatus("dirty");
      dirtySince.current ??= Date.now();
      clearTimer();
      const waited = Date.now() - dirtySince.current;
      timer.current = setTimeout(() => void flush(), Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - waited)));
    },
    [clearTimer, flush],
  );

  const discard = useCallback(() => {
    clearTimer();
    dirtySince.current = null;
    lastSent.current = latest.current;
  }, [clearTimer]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") void flush();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Ağaç dışından (sidebar, komut paleti, Geri) ayrılınca da bekleyen yazım
      // kaybolmasın. Değişiklik yoksa hiçbir şey göndermiyor — StrictMode'un çift
      // mount'u zararsız.
      void flush();
    };
  }, [flush]);

  return { status, update, flush, discard };
}
