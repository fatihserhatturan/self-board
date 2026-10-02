import { ModuleSettings } from "@/components/settings/module-settings";
import { getEnabledModuleIds } from "@/lib/data/modules";

export default async function ModuleSettingsPage() {
  const enabledModuleIds = await getEnabledModuleIds();
  return <ModuleSettings enabledModuleIds={enabledModuleIds} />;
}
