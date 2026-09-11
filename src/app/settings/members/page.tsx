import { MemberSettings } from "@/components/settings/member-settings";
import { getCurrentUser, getUsers } from "@/lib/data/issues";

export default async function MemberSettingsPage() {
  const [members, currentUser] = await Promise.all([getUsers(), getCurrentUser()]);
  return <MemberSettings members={members} currentUserId={currentUser?.id ?? null} />;
}
