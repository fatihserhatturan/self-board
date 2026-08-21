import { Layers } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function ViewsPage() {
  return (
    <>
      <TopBar title="Views" />
      <EmptyState icon={Layers} title="Henüz kayıtlı görünüm yok" />
    </>
  );
}
