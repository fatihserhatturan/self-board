"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import type { BoardIssue } from "@/lib/data/issues";

export interface AppShellContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  createIssueOpen: boolean;
  setCreateIssueOpen: (open: boolean) => void;
  issues: BoardIssue[];
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell() must be used within an <AppShellProvider>");
  }
  return ctx;
}

export function AppShellProvider({
  children,
  issues,
}: {
  children: ReactNode;
  issues: BoardIssue[];
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageState(
    "self-board:sidebar-collapsed",
    false,
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AppShellContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
        commandOpen,
        setCommandOpen,
        createIssueOpen,
        setCreateIssueOpen,
        issues,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}
