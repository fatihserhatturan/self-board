import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dosya izleme, Electron çıktısını (release/, dist-electron/) ve yerel
  // veritabanını standalone kopyaya taşıyordu: paket hem şişiyor hem de
  // geliştirme verisi kurulum dosyasına giriyordu.
  outputFileTracingExcludes: {
    "*": ["release/**/*", "release-debug/**/*", "dist-electron/**/*", "data/**/*"],
  },
  // Dev sunucusu yalnızca 127.0.0.1'e bağlanıyor (`next dev -H 127.0.0.1`) —
  // varsayılan 0.0.0.0'da kimlik doğrulamasız veri aynı ağdaki herkese açıktı.
  // Electron dev penceresi aynı host'u kullanıyor; `localhost`'tan açan tarayıcı
  // da HMR'dan mahrum kalmasın.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
