"use client";

import { useEffect, useState } from "react";
import { listProjectCycles } from "@/lib/actions/cycles";
import { listProjectStates } from "@/lib/actions/workflow-states";
import type { Cycle } from "@/lib/data/cycles";
import type { WorkflowState } from "@/lib/board/workflow-config";

const EMPTY: never[] = [];

/**
 * Bir projenin istemcide sonradan yüklenen verisi. Sonuç yüklendiği proje
 * id'siyle saklanıyor ve yalnızca istenen id'yle eşleşirse dönüyor — proje
 * değişince bir önceki projenin listesi bir an bile kullanılmıyor (global
 * dialog'da bu, issue'nun başka projenin durum id'sini almasına yol açıyordu).
 *
 * `projectId` `null` iken istek atılmaz; dialog her açılışta `null`'dan gerçek
 * id'ye geçtiği için veri o anda tazelenir.
 */
function useProjectData<T>(
  projectId: string | null,
  load: (projectId: string) => Promise<T[]>,
): { data: T[]; loaded: boolean } {
  const [result, setResult] = useState<{ projectId: string; data: T[] } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void load(projectId).then((data) => {
      if (!cancelled) setResult({ projectId, data });
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, load]);

  const loaded = projectId !== null && result?.projectId === projectId;
  return { data: loaded ? result.data : EMPTY, loaded };
}

export function useProjectCycles(projectId: string | null): { data: Cycle[]; loaded: boolean } {
  return useProjectData(projectId, listProjectCycles);
}

export function useProjectStates(projectId: string | null): {
  data: WorkflowState[];
  loaded: boolean;
} {
  return useProjectData(projectId, listProjectStates);
}
