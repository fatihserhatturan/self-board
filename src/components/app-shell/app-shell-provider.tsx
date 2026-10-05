"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { isTypingTarget } from "@/lib/keyboard";
import type { IssueIndexEntry } from "@/lib/data/issues";
import type { Project } from "@/lib/data/projects";
import type { ModuleSearchEntry } from "@/lib/modules/registry";

export interface AppShellContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  createIssueOpen: boolean;
  setCreateIssueOpen: (open: boolean) => void;
  /** Komut paletinin aradığı hafif issue listesi (id, başlık, proje). */
  issueIndex: IssueIndexEntry[];
  /** Açık modüllerin palette aranan kayıtları (ör. wiki sayfaları). */
  moduleSearchEntries: ModuleSearchEntry[];
  projects: Project[];
  /** Yeni issue dialog'u "bana ata" tercihini burada çözüyor. */
  currentUserId: string | null;
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
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
  issueIndex,
  moduleSearchEntries,
  projects,
  currentUserId,
}: {
  children: ReactNode;
  issueIndex: IssueIndexEntry[];
  moduleSearchEntries: ModuleSearchEntry[];
  projects: Project[];
  currentUserId: string | null;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageState(
    "self-board:sidebar-collapsed",
    false,
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [storedProjectId, setStoredProjectId] = useLocalStorageState<string | null>(
    "self-board:active-project-id",
    null,
    (value) => value ?? "",
    (raw) => raw || null,
  );
  // localStorage'daki proje id'si silinmiş/geçersiz olabilir (başka bir
  // sekmede silinmiş, eski bir tarayıcı state'i) — her zaman güncel `projects`
  // listesine göre "iyileşen" bir değer türetiyoruz, ham storage değerini
  // doğrudan güvenmiyoruz.
  const activeProjectId = projects.some((project) => project.id === storedProjectId)
    ? storedProjectId
    : (projects[0]?.id ?? null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      // Komut paleti yazarken de açılabilmeli (ör. wiki editöründeyken); Mod+K
      // metin girişinde başka bir anlam taşımıyor, editörde de bağlı değil.
      if (mod && key === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }

      // Metin yazarken diğer global kısayollar tetiklenmemeli — özellikle
      // değiştiricisiz `c`, aksi halde her "c" harfi dialog açardı.
      if (isTypingTarget(event.target)) return;
      if (mod && key === "b") {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
        return;
      }
      // Açık bir dialog içindeyken (odak bir düğmedeyse `isTypingTarget` false
      // kalıyor) `c` yeni issue dialog'unu üst üste açıyordu.
      if (event.target instanceof Element && event.target.closest('[role="dialog"]')) return;
      if (!mod && !event.altKey && key === "c") {
        event.preventDefault();
        setCreateIssueOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  return (
    <AppShellContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
        commandOpen,
        setCommandOpen,
        createIssueOpen,
        setCreateIssueOpen,
        issueIndex,
        moduleSearchEntries,
        projects,
        currentUserId,
        activeProjectId,
        setActiveProjectId: setStoredProjectId,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}
