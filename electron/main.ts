import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { app, BrowserWindow, dialog, screen, shell } from "electron";

const isDev = process.env.SELF_BOARD_DEV === "1";
const DEV_PORT = 3000;
// `next dev -H 127.0.0.1` ile aynı host: sunucu hangi host'la başlatıldıysa o
// origin'den gelen HMR/statik chunk isteklerine izin veriyor (bkz. next.config.ts).
const DEV_URL = `http://127.0.0.1:${DEV_PORT}`;

// `tokens.css` içindeki `--color-bg-app` ile aynı: pencere boyanana kadar
// arkada Electron'un varsayılan beyazı yerine uygulamanın zemini görünsün.
const APP_BACKGROUND_COLOR = "#181921";

const DEFAULT_BOUNDS = { width: 1280, height: 800 };
const SAVE_BOUNDS_DEBOUNCE_MS = 500;

/** Harici tarayıcıda açılmasına izin verilen protokoller — `file:` ya da özel şemalar değil. */
const EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Sunucu hazır olana kadar gösterilen ekran. Eskiden pencere `show: false` ile
 * açılıp `ready-to-show`'da gösteriliyordu; o olay ancak gerçek sayfa
 * yüklendiğinde geldiği için soğuk başlangıçta pencere yine saniyelerce yoktu.
 */
const LOADING_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{height:100%;margin:0;background:${APP_BACKGROUND_COLOR};color:#858699;
  font:13px system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
  .dot{display:inline-block;width:6px;height:6px;margin:0 3px;border-radius:50%;background:#5e6ad2;
  animation:p 1s infinite ease-in-out}.dot:nth-child(2){animation-delay:.15s}.dot:nth-child(3){animation-delay:.3s}
  @keyframes p{0%,80%,100%{opacity:.25}40%{opacity:1}}
</style></head><body><div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></body></html>`;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverUrl: Promise<string> | null = null;
let quitting = false;

interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized?: boolean;
}

function windowStatePath(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

/**
 * Kaydedilmiş konum, o an bağlı olmayan bir monitördeyse pencere ekran dışında
 * açılıyordu; görünür bir ekranla kesişmiyorsa konum atılıp ortalanıyor.
 */
function loadWindowBounds(): WindowBounds {
  try {
    const parsed = JSON.parse(readFileSync(windowStatePath(), "utf-8")) as WindowBounds;
    if (typeof parsed.width !== "number" || typeof parsed.height !== "number") {
      return DEFAULT_BOUNDS;
    }
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      const rect = { x: parsed.x, y: parsed.y, width: parsed.width, height: parsed.height };
      const area = screen.getDisplayMatching(rect).workArea;
      const visible =
        rect.x < area.x + area.width &&
        rect.x + rect.width > area.x &&
        rect.y < area.y + area.height &&
        rect.y + rect.height > area.y;
      if (!visible) return { width: parsed.width, height: parsed.height, maximized: parsed.maximized };
    }
    return parsed;
  } catch {
    return DEFAULT_BOUNDS;
  }
}

function saveWindowBounds(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height, x, y } = mainWindow.getNormalBounds();
  const state: WindowBounds = { width, height, x, y, maximized: mainWindow.isMaximized() };
  try {
    writeFileSync(windowStatePath(), JSON.stringify(state), "utf-8");
  } catch {
    // Durum kaydedilemezse uygulama yine çalışmalı — sessizce geçiliyor.
  }
}

/** `resize`/`move` sürükleme boyunca saniyede onlarca kez geliyor; her birinde senkron yazmamak için. */
let saveTimer: NodeJS.Timeout | null = null;
function scheduleSaveWindowBounds(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveWindowBounds();
  }, SAVE_BOUNDS_DEBOUNCE_MS);
}

/**
 * Next standalone sunucusunu kapatır. Windows'ta `kill()` yalnızca doğrudan
 * çocuğu hedefliyor ve sunucu arkada çalışmaya devam edebiliyordu; orada süreç
 * ağacının tamamı `taskkill /T` ile kapatılıyor.
 */
function stopServerProcess(): void {
  if (!serverProcess) return;
  const child = serverProcess;
  serverProcess = null;

  if (process.platform === "win32" && child.pid !== undefined) {
    try {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      return;
    } catch {
      // taskkill yoksa aşağıdaki genel yola düşülüyor.
    }
  }
  child.kill();
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // Sunucu henüz ayakta değil, tekrar dene.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

/**
 * Boş bir yerel port. `get-port` paketinin yerini alıyor: o bir devDependency
 * olduğu için paketlenmiş uygulamaya girmiyor ve açılışta modül bulunamıyordu.
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => (port ? resolve(port) : reject(new Error("No free port"))));
    });
  });
}

function resolveStandaloneServerPath(): string {
  // Paketlenmiş uygulamada standalone sunucu ağacı ASAR dışında, extraResources ile taşınır.
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");
  return path.join(base, "server.js");
}

function resolveAppIconPath(): string {
  // Paketlenmiş uygulamada icon.png ASAR dışında, extraResources ile taşınır.
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.png")
    : path.join(__dirname, "..", "resources", "icon", "icon.png");
}

function failAndQuit(error: unknown): void {
  dialog.showErrorBox(
    "self-board başlatılamadı",
    error instanceof Error ? error.message : String(error),
  );
  quitting = true;
  app.quit();
}

async function startProdServer(): Promise<string> {
  const port = await findFreePort();
  const serverPath = resolveStandaloneServerPath();

  // Electron'un kendi gömülü Node çalışma zamanını, ayrı bir Node kurulumuna ihtiyaç
  // duymadan düz bir Node scripti çalıştırmak için kullanır.
  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1",
      SELF_BOARD_DB_DIR: app.getPath("userData"),
    },
    stdio: "inherit",
  });

  // Sunucu uygulama açıkken düşerse pencere sessizce ölü bir sayfaya dönüşüyordu.
  serverProcess.on("exit", (code) => {
    serverProcess = null;
    if (quitting) return;
    failAndQuit(new Error(`Sunucu beklenmedik şekilde kapandı (çıkış kodu ${code}).`));
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
}

/** Sunucu uygulama ömrü boyunca bir kez başlatılır; pencere yeniden açılınca paylaşılır. */
function ensureServer(): Promise<string> {
  if (!serverUrl) {
    serverUrl = isDev ? waitForServer(DEV_URL).then(() => DEV_URL) : startProdServer();
  }
  return serverUrl;
}

async function createWindow() {
  const bounds = loadWindowBounds();
  const window = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: APP_BACKGROUND_COLOR,
    icon: resolveAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow = window;
  if (bounds.maximized) window.maximize();
  void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`);

  window.on("resize", scheduleSaveWindowBounds);
  window.on("move", scheduleSaveWindowBounds);
  window.on("maximize", saveWindowBounds);
  window.on("unmaximize", saveWindowBounds);
  window.on("close", saveWindowBounds);
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  const url = await ensureServer();
  const origin = new URL(url).origin;

  // Render edilen içerikteki harici linkler (target="_blank") pencereyi ele
  // geçirmesin; izinli protokollerse OS'nin varsayılan tarayıcısında açılsın.
  window.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    openExternalSafely(targetUrl);
    return { action: "deny" };
  });

  // Aynı pencere içinde uygulamanın kendi origin'i dışına bir navigasyon denenirse
  // (ör. target'sız bir link) yine harici tarayıcıya yönlendir, pencereyi koru.
  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (safeOrigin(targetUrl) !== origin) {
      event.preventDefault();
      openExternalSafely(targetUrl);
    }
  });

  if (!window.isDestroyed()) await window.loadURL(url);
}

function safeOrigin(raw: string): string | null {
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function openExternalSafely(raw: string): void {
  try {
    if (EXTERNAL_PROTOCOLS.has(new URL(raw).protocol)) void shell.openExternal(raw);
  } catch {
    // Geçersiz URL — yok sayılıyor.
  }
}

// İkinci bir örnek aynı SQLite dosyasına ayrı bir sunucuyla yazardı; onun yerine
// var olan pencere öne getiriliyor.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      void createWindow().catch(failAndQuit);
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => createWindow().catch(failAndQuit));

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  // macOS: dock'tan yeniden açılınca yalnızca pencere açılır; sunucu `ensureServer`
  // sayesinde paylaşılıyor (önceden her seferinde ikinci bir sunucu başlıyordu).
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow().catch(failAndQuit);
  });

  app.on("before-quit", () => {
    quitting = true;
    saveWindowBounds();
    stopServerProcess();
  });
}
