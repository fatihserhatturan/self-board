import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg-app px-6 text-center">
      <h1 className="text-title2 font-medium text-text-primary">self-board</h1>
      <p className="max-w-md text-normal text-text-secondary">
        Tasarım sistemi çekirdeği bu fazda kuruldu. Tüm token ve component&apos;leri
        görmek için showcase sayfasına göz atabilirsin.
      </p>
      <Button asChild>
        <Link href="/design-system">Tasarım sistemine git</Link>
      </Button>
    </main>
  );
}
