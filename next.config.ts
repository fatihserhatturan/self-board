import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
