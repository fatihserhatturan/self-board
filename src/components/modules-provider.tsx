"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/lib/modules/registry";

export interface ModulesContextValue {
  /** Etkin modüller, registry sırasıyla — sidebar/ayarlar bunu doğrudan map'ler. */
  enabledModules: ModuleDefinition[];
}

const ModulesContext = createContext<ModulesContextValue>({ enabledModules: [] });

export function useModules(): ModulesContextValue {
  return useContext(ModulesContext);
}

/**
 * Sunucudan gelen etkin modül id listesi. `PreferencesProvider` ile aynı
 * kalıp: ayrı bir istemci durumu yok, yazma yolu server action +
 * `router.refresh()`.
 */
export function ModulesProvider({
  enabledModuleIds,
  children,
}: {
  enabledModuleIds: string[];
  children: ReactNode;
}) {
  const value = useMemo<ModulesContextValue>(() => {
    const enabledSet = new Set(enabledModuleIds);
    return { enabledModules: MODULE_REGISTRY.filter((module) => enabledSet.has(module.id)) };
  }, [enabledModuleIds]);

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}
