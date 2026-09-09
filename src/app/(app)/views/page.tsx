import { redirect } from "next/navigation";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

// Tek takım (`DEFAULT_TEAM`) olduğu için workspace-seviyesi Views sayfası,
// takım-seviyesindeki gerçek uygulamaya yönlendiriyor — iki ayrı boş sayfa
// mantığı tekrarlamak yerine.
export default function ViewsPage() {
  redirect(`/team/${DEFAULT_TEAM.slug}/views`);
}
