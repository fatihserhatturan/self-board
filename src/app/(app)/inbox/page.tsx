import { Inbox } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function InboxPage() {
  return (
    <>
      <TopBar title="Inbox" />
      <EmptyState icon={Inbox} title="Gelen kutunuz boş" />
    </>
  );
}
