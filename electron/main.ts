import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { app, BrowserWindow, dialog, shell } from "electron";

const isDev = process.env.SELF_BOARD_DEV === "1";
const DEV_PORT = 3000;
// "localhost" kullanılır: next dev, 127.0.0.1'i cross-origin sayıp HMR/statik chunk isteklerini engelliyor.
const DEV_URL = `http://localhost:${DEV_PORT}`;

// `tokens.css` içindeki `--color-bg-app` ile aynı: pencere boyanana kadar
// arkada Electron'un varsayılan beyazı yerine uygulamanın zemini görünsün.
const APP_BACKGROUND_COLOR = "#181921";

const DEFAULT_BOUNDS = { width: 1280, height: 800 };

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

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

/** Pencere boyutu/konumu her açılışta sıfırlanıyordu; userData altında saklanıyor. */
function loadWindowBounds(): WindowBounds {
  try {
    const parsed = JSON.parse(readFileSync(windowStatePath(), "utf-8")) as WindowBounds;
    if (typeof parsed.width !== "number" || typeof parsed.height !== "number") {
      return DEFAULT_BOUNDS;
    }
    return parsed;
  } catch {
    return DEFAULT_BOUNDS;
  }
}

function saveWindowBounds(): void {
  if (!mainWindow) return;
  const { width, height, x, y } = mainWindow.getNormalBounds();
  const state: WindowBounds = { width, height, x, y, maximized: mainWindow.isMaximized() };
  try {
    writeFileSync(windowStatePath(), JSON.stringify(state), "utf-8");
  } catch {
    // Durum kaydedilemezse uygulama yine çalışmalı — sessizce geçiliyor.
  }
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

async function startProdServer(): Promise<number> {
  const { default: getPort } = await import("get-port");
  const port = await getPort({ port: 3000 });
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

  serverProcess.on("exit", (code) => {
    console.error(`Next server process exited with code ${code}`);
    serverProcess = null;
  });

  return port;
}

async function createWindow() {
  // Pencere sunucudan ÖNCE açılıyor: eskiden `startProdServer()` +
  // `waitForServer()` bitene kadar hiçbir şey görünmüyordu, kullanıcı soğuk
  // başlangıçta saniyelerce boş masaüstüne bakıyordu. `show: false` + ilk
  // boyamada gösterme, `backgroundColor` ise koyu temada beyaz flaşı önlüyor.
  const bounds = loadWindowBounds();
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: APP_BACKGROUND_COLOR,
    icon: resolveAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (bounds.maximized) mainWindow.maximize();
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  const port = isDev ? DEV_PORT : await startProdServer();
  const url = isDev ? DEV_URL : `http://127.0.0.1:${port}`;

  await waitForServer(url);

  // Render edilen markdown içeriğindeki harici linkler (target="_blank") pencereyi
  // ele geçirmesin; OS'nin varsayılan tarayıcısında açılsın.
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    void shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  // Aynı pencere içinde uygulamanın kendi origin'i dışına bir navigasyon denenirse
  // (ör. target'sız bir link) yine harici tarayıcıya yönlendir, pencereyi koru.
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (new URL(targetUrl).origin !== new URL(url).origin) {
      event.preventDefault();
      void shell.openExternal(targetUrl);
    }
  });

  await mainWindow.loadURL(url);

  mainWindow.on("resize", saveWindowBounds);
  mainWindow.on("move", saveWindowBounds);
  mainWindow.on("maximize", saveWindowBounds);
  mainWindow.on("unmaximize", saveWindowBounds);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    dialog.showErrorBox(
      "self-board başlatılamadı",
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});

app.on("before-quit", () => {
  saveWindowBounds();
  stopServerProcess();
});
