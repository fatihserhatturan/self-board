import { SettingsContent } from "@/components/settings/settings-content";
import { getCurrentUser, getLabels } from "@/lib/data/issues";

// Diğer route'larda olduğu gibi: canlı SQLite state'i okuyor, build-time
// statik üretim denemesine mahal vermemek için dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [labels, currentUser] = await Promise.all([getLabels(), getCurrentUser()]);

  return <SettingsContent labels={labels} currentUser={currentUser} />;
}
