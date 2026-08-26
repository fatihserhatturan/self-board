import { cpSync, existsSync } from "node:fs";
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

console.log("Copied .next/static and public/ into .next/standalone/");
