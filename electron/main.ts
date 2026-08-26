import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { app, BrowserWindow, dialog } from "electron";

const isDev = process.env.SELF_BOARD_DEV === "1";
const DEV_PORT = 3000;
// "localhost" kullanılır: next dev, 127.0.0.1'i cross-origin sayıp HMR/statik chunk isteklerini engelliyor.
const DEV_URL = `http://localhost:${DEV_PORT}`;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

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
  const port = isDev ? DEV_PORT : await startProdServer();
  const url = isDev ? DEV_URL : `http://127.0.0.1:${port}`;

  await waitForServer(url);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: resolveAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await mainWindow.loadURL(url);
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
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
