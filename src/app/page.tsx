import { redirect } from "next/navigation";
import { getPreferences } from "@/lib/data/preferences";
import { HOME_VIEW_PATH } from "@/lib/preferences-config";

export default async function Home() {
  // Başlangıç sayfası bir tercih: Ayarlar > Tercihler altından değiştiriliyor.
  const { homeView } = await getPreferences();
  redirect(HOME_VIEW_PATH[homeView]);
}
