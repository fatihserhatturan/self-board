import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/types";
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
  const [preferences, cookieStore] = await Promise.all([getPreferences(), cookies()]);
  // Dil cookie'den: ilk boyama doğru dille geliyor, dil değişimi de sunucu
  // render'ıyla tutarlı kalıyor.
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale} className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full flex flex-col font-sans antialiased">
        <LocaleProvider initialLocale={locale}>
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
