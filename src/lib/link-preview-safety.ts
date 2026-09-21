import { BlockList, isIPv4, isIPv6 } from "node:net";

/**
 * Link önizlemesinin istek atmasına izin verilmeyen adresler. Hostname deseni
 * tek başına yetmiyordu: herkese açık bir alan adı özel bir IP'ye çözülebiliyor
 * (DNS rebinding, `*.localtest.me` gibi servisler) ve sunucu yerel ağa istek
 * atıyordu. Bu yüzden çözülen IP'ler de kontrol ediliyor.
 *
 * Saf ve DB'siz: test edilebilsin diye `lib/actions/link-preview.ts`'ten ayrı.
 */
const blocked = new BlockList();
// IPv4
blocked.addSubnet("0.0.0.0", 8, "ipv4"); // "bu ağ"
blocked.addSubnet("10.0.0.0", 8, "ipv4"); // özel
blocked.addSubnet("100.64.0.0", 10, "ipv4"); // CGNAT
blocked.addSubnet("127.0.0.0", 8, "ipv4"); // loopback
blocked.addSubnet("169.254.0.0", 16, "ipv4"); // link-local (bulut metadata dahil)
blocked.addSubnet("172.16.0.0", 12, "ipv4"); // özel
blocked.addSubnet("192.0.0.0", 24, "ipv4"); // IETF protokol atamaları
blocked.addSubnet("192.168.0.0", 16, "ipv4"); // özel
blocked.addSubnet("198.18.0.0", 15, "ipv4"); // kıyaslama
blocked.addSubnet("224.0.0.0", 4, "ipv4"); // multicast
blocked.addSubnet("240.0.0.0", 4, "ipv4"); // ayrılmış (255.255.255.255 dahil)
// IPv6
blocked.addAddress("::", "ipv6");
blocked.addAddress("::1", "ipv6"); // loopback
blocked.addSubnet("fc00::", 7, "ipv6"); // unique local
blocked.addSubnet("fe80::", 10, "ipv6"); // link-local
blocked.addSubnet("ff00::", 8, "ipv6"); // multicast

/** `::ffff:127.0.0.1` gibi IPv4-mapped adresleri IPv4 olarak değerlendirir. */
function normalizeAddress(address: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  return mapped ? mapped[1] : address;
}

export function isBlockedAddress(address: string): boolean {
  const normalized = normalizeAddress(address.trim());
  if (isIPv4(normalized)) return blocked.check(normalized, "ipv4");
  if (isIPv6(normalized)) return blocked.check(normalized, "ipv6");
  // IP değilse (beklenmeyen bir çözümleme sonucu) güvenli tarafta kal.
  return true;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

/**
 * Meta etiketlerinde sık geçen HTML entity'lerini çözer — başlıklar
 * "Foo &amp; Bar" gibi görünüyordu.
 */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name: string) => {
    const key = name.toLowerCase();
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[key] ?? match;
  });
}
