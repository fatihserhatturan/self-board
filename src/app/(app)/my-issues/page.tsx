import { ListTodo } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function MyIssuesPage() {
  return (
    <>
      <TopBar title="My Issues" primaryActionLabel="Yeni Issue" />
      <EmptyState
        icon={ListTodo}
        title="Henüz issue yok"
        action={{ label: "Yeni issue oluştur" }}
      />
    </>
  );
}
