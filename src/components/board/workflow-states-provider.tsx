"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WorkflowState } from "@/lib/board/workflow-config";

const WorkflowStatesContext = createContext<WorkflowState[]>([]);

/**
 * Görünümdeki issue'ların durumları. Sağ tık menüsü issue kartının ve liste
 * satırının içinde, yani ağacın en ucunda duruyor; durumları oraya prop
 * zinciriyle indirmek yerine tek bir context'ten okunuyor. Projeler-arası
 * görünümlerde (My Issues) tüm projelerin durumları taşınıyor — menü issue'nun
 * kendi projesininkileri seçiyor.
 */
export function useProjectStatesFromContext(projectId: string): WorkflowState[] {
  return useContext(WorkflowStatesContext).filter((state) => state.projectId === projectId);
}

export function WorkflowStatesProvider({
  states,
  children,
}: {
  states: WorkflowState[];
  children: ReactNode;
}) {
  return <WorkflowStatesContext.Provider value={states}>{children}</WorkflowStatesContext.Provider>;
}
