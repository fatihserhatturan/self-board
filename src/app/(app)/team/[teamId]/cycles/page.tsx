import { notFound } from "next/navigation";
import { RotateCw } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

export default async function TeamCyclesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  return (
    <>
      <TopBar title="Cycles" breadcrumb={DEFAULT_TEAM.name} primaryActionLabel="Yeni Cycle" />
      <EmptyState icon={RotateCw} title="Henüz cycle yok" />
    </>
  );
}
