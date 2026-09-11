import { AboutSettings } from "@/components/settings/about-settings";
import { getDbPath } from "@/lib/db/client";
import { version } from "../../../../package.json";

export default function AboutSettingsPage() {
  return (
    <AboutSettings
      version={version}
      platform={`${process.platform} ${process.arch}`}
      nodeVersion={process.version}
      databasePath={getDbPath()}
    />
  );
}
