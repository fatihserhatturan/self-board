import { LabelSettings } from "@/components/settings/label-settings";
import { getLabels, getLabelUsage } from "@/lib/data/issues";

export default async function LabelSettingsPage() {
  const [labels, usage] = await Promise.all([getLabels(), getLabelUsage()]);
  return <LabelSettings labels={labels} usage={usage} />;
}
