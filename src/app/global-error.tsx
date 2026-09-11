"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Son çare sınır: kök layout ya da `(app)` layout'u render edilemediğinde
 * devreye girer ve kök layout'un yerini alır — bu yüzden kendi `<html>`/`<body>`
 * ağacını kurar ve `LocaleProvider`'a erişemez, metinler varsayılan dilde sabit.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr" data-theme="dark">
      <body className="flex h-full min-h-screen flex-col items-center justify-center gap-3 px-6 text-center font-sans antialiased">
        <p className="text-large font-medium text-text-primary">self-board başlatılamadı</p>
        <p className="max-w-sm text-small text-text-secondary">
          Beklenmeyen bir hata oluştu. Sorun sürerse uygulamayı yeniden başlat.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex h-8 items-center rounded-md bg-accent px-3 text-small font-medium text-text-on-accent"
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
