"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WorkflowState } from "@/lib/board/workflow-config";

const WorkflowStatesContext = createContext<WorkflowState[]>([]);

/**
 * Aktif projenin durumları. Sağ tık menüsü issue kartının ve liste satırının
 * içinde, yani ağacın en ucunda duruyor; durumları oraya prop zinciriyle
 * indirmek yerine tek bir context'ten okunuyor. Projeler-arası görünümlerde
 * (My Issues) boş kalır ve menünün durum bölümü gizlenir.
 */
export function useWorkflowStates(): WorkflowState[] {
  return useContext(WorkflowStatesContext);
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
