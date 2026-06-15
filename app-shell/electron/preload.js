/**
 * Phase 5.26.2 — Electron Preload Bridge
 * جسر آمن بين الواجهة وخصائص تطبيق سطح المكتب بدون تفعيل nodeIntegration داخل الصفحة.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('SandNativeBridge', {
  platform: 'electron',
  phase: '5.26.2',
  openExternal: (url) => ipcRenderer.invoke('sand:openExternal', url),
  print: () => ipcRenderer.invoke('sand:print'),
  saveTextFile: (payload) => ipcRenderer.invoke('sand:saveTextFile', payload),
  getDesktopInfo: () => ipcRenderer.invoke('sand:getDesktopInfo')
});
