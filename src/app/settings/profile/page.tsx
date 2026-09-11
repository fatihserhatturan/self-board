import { ProfileSettings } from "@/components/settings/profile-settings";
import { getCurrentUser } from "@/lib/data/issues";

export default async function ProfileSettingsPage() {
  const currentUser = await getCurrentUser();
  return <ProfileSettings currentUser={currentUser} />;
}
