import { FolderKanban } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectsPage() {
  return (
    <>
      <TopBar title="Projects" viewSwitcher primaryActionLabel="Yeni Proje" />
      <EmptyState icon={FolderKanban} title="Henüz proje yok" />
    </>
  );
}
