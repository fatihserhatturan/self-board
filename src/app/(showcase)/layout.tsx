import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  // Tasarım sistemi kataloğu bir geliştirme aracı; paketlenmiş uygulamada
  // gezinilebilir bir sayfa olarak durmasının bir anlamı yok.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-full flex-col bg-bg-app">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border-default bg-bg-app/90 px-6 py-3 backdrop-blur">
          <Link href="/" className="text-small font-medium text-text-primary">
            self-board <span className="text-text-tertiary">/ design system</span>
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex-1 px-6 py-10">{children}</div>
      </div>
    </TooltipProvider>
  );
}
