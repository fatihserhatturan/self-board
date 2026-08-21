import { AppShellProvider } from "@/components/app-shell/app-shell-provider";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { Sidebar } from "@/components/app-shell/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <AppShellProvider>
        <div className="flex h-full min-h-0">
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </div>
        <CommandPalette />
      </AppShellProvider>
    </TooltipProvider>
  );
}
