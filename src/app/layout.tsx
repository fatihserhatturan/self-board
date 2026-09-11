import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import { PreferencesProvider } from "@/components/preferences-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { getPreferences } from "@/lib/data/preferences";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "self-board",
  description: "Tek kişilik geliştiriciler için proje yönetim uygulaması",
};

// Tercihler burada okunuyor: hem `(app)` hem `settings` ağacı aynı değerlere
// erişsin diye tek sağlayıcı kökte duruyor.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const preferences = await getPreferences();

  return (
    <html lang="tr" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full flex flex-col font-sans antialiased">
        <LocaleProvider>
          <PreferencesProvider preferences={preferences}>
            {/* `enableSystem`: işletim sistemi temasını izleyen üçüncü bir seçenek —
                ayarlarda "Sistem" olarak sunuluyor. Varsayılan hâlâ koyu tema. */}
            <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
              {children}
              <Toaster />
            </ThemeProvider>
          </PreferencesProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
