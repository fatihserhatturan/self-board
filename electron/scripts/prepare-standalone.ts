import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..", "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  throw new Error(`Standalone output not found at ${standaloneDir}. Run "next build" first.`);
}

cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
});
cpSync(path.join(root, "public"), path.join(standaloneDir, "public"), { recursive: true });

// Sunucu bu dizinden çalıştığında (`cwd`), `SELF_BOARD_DB_DIR` verilmezse
// veritabanını buraya açıyor. Eski derlemelerden kalan bu dosya kuruluma
// gireceği için siliniyor — kimse başkasının verisiyle başlamasın.
for (const stale of ["data", "release", "release-debug"]) {
  rmSync(path.join(standaloneDir, stale), { recursive: true, force: true });
}

console.log("Copied .next/static and public/ into .next/standalone/");
