import { SettingsShell } from "@/components/settings/settings-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

// `(app)` grubunun dışında: uygulama kenar çubuğu ve üst çubuk burada yok,
// ayarlar pencereyi devralıyor. Tooltip sağlayıcısı `(app)` layout'undan
// gelmediği için burada yeniden kuruluyor.
export const dynamic = "force-dynamic";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <SettingsShell>{children}</SettingsShell>
    </TooltipProvider>
  );
}
