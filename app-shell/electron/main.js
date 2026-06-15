/**
 * Phase 5.26.2 — Windows Desktop Electron Main Process
 * يشغّل المنصة كنافذة تطبيق مستقلة مع حماية أساسية، فتح آمن للروابط، طباعة، وحفظ ملفات.
 */
const { app, BrowserWindow, shell, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const INDEX_FILE = path.join(ROOT, 'index.html');
const APP_TITLE = 'الدليل القضائي الذكي لأعضاء النيابة العامة';

let mainWindow = null;

function createWindow(){
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    backgroundColor: '#050506',
    title: APP_TITLE,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (isExternalUrl(url, current)) {
      event.preventDefault();
      openExternalSafe(url);
    }
  });

  mainWindow.loadFile(INDEX_FILE);
  return mainWindow;
}

function isExternalUrl(url, currentUrl){
  try{
    const target = new URL(url);
    if(['file:','app:'].includes(target.protocol)) return false;
    if(currentUrl){
      const current = new URL(currentUrl);
      if(target.origin === current.origin) return false;
    }
    return ['http:','https:','mailto:','tel:'].includes(target.protocol);
  }catch(_){ return false; }
}

async function openExternalSafe(url){
  if(!url) return false;
  try{
    await shell.openExternal(url);
    return true;
  }catch(err){
    console.error('Failed to open external URL:', err);
    return false;
  }
}

function createAppMenu(){
  const template = [
    {
      label: 'المنصة',
      submenu: [
        { label: 'إعادة تحميل', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'ملء الشاشة', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'خروج', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'الأدوات',
      submenu: [
        { label: 'طباعة', accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.print({ silent: false, printBackground: true }) },
        { label: 'فتح أدوات المطور', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('sand:openExternal', async (_event, url) => openExternalSafe(url));
ipcMain.handle('sand:print', async () => {
  if(!mainWindow) return false;
  mainWindow.webContents.print({ silent: false, printBackground: true });
  return true;
});
ipcMain.handle('sand:saveTextFile', async (_event, payload = {}) => {
  if(!mainWindow) return { ok:false, reason:'NO_WINDOW' };
  const { filename = 'sand-export.txt', text = '', filters } = payload;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'حفظ ملف من المنصة',
    defaultPath: filename,
    filters: filters || [{ name: 'Text / JSON', extensions: ['txt','json'] }, { name: 'All Files', extensions: ['*'] }]
  });
  if(result.canceled || !result.filePath) return { ok:false, canceled:true };
  fs.writeFileSync(result.filePath, text, 'utf8');
  return { ok:true, path: result.filePath };
});
ipcMain.handle('sand:getDesktopInfo', async () => ({
  phase: '5.26.2',
  platform: process.platform,
  version: app.getVersion(),
  electron: process.versions.electron,
  node: process.versions.node,
  root: ROOT
}));

app.whenReady().then(() => {
  app.setAppUserModelId('eg.prosecution.northassiut.sand');
  createAppMenu();
  createWindow();
});

app.on('window-all-closed', () => { if(process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });
