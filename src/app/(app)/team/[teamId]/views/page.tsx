import { notFound } from "next/navigation";
import { Layers } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

export default async function TeamViewsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  return (
    <>
      <TopBar title="Views" breadcrumb={DEFAULT_TEAM.name} />
      <EmptyState icon={Layers} title="Henüz kayıtlı görünüm yok" />
    </>
  );
}
