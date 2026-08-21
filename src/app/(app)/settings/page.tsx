import { Settings } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <EmptyState icon={Settings} title="Ayarlar yakında" />
    </>
  );
}
