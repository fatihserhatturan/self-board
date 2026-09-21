const { cpSync, existsSync } = require("node:fs");
const path = require("node:path");

/**
 * electron-builder `extraResources` kopyasında `node_modules` dizinlerini her
 * koşulda atlıyor (açık `filter` verilse bile). Next'in standalone sunucusu ise
 * kendi budanmış `node_modules`'ü olmadan açılmıyor: "Cannot find module 'next'".
 * Bu yüzden ağaç paketleme bittikten sonra, kurulum dosyası üretilmeden önce
 * elle kopyalanıyor.
 */
exports.default = async function afterPack(context) {
  const root = path.join(__dirname, "..", "..");
  const source = path.join(root, ".next", "standalone", "node_modules");
  const target = path.join(context.appOutDir, "resources", "standalone", "node_modules");

  if (!existsSync(source)) {
    throw new Error(`Standalone node_modules not found at ${source}. Run "next build" first.`);
  }

  cpSync(source, target, { recursive: true });
  console.log(`  • copied standalone node_modules  to=${target}`);
};
