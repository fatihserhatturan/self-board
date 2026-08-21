import { notFound } from "next/navigation";
import { ListTodo } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

export default async function TeamIssuesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  return (
    <>
      <TopBar
        title="Issues"
        breadcrumb={DEFAULT_TEAM.name}
        viewSwitcher
        primaryActionLabel="Yeni Issue"
      />
      <EmptyState icon={ListTodo} title="Henüz issue yok" />
    </>
  );
}
