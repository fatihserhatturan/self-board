import { DataSettings } from "@/components/settings/data-settings";
import { getWorkspaceStats } from "@/lib/data/stats";

export default async function DataSettingsPage() {
  const stats = await getWorkspaceStats();
  return <DataSettings stats={stats} />;
}
