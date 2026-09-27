const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('node:path');
let win, hole, timer, ignored = false, align = false, displayIndex = 0;
const send = action => win?.webContents.send('action', action);
function fit() { const displays = screen.getAllDisplays(); displayIndex %= displays.length; win.setBounds(displays[displayIndex].workArea); }
if (!app.requestSingleInstanceLock()) app.quit();
else {
app.on('second-instance', () => { win?.show(); });
app.whenReady().then(() => {
  win = new BrowserWindow({ ...screen.getPrimaryDisplay().workArea, frame:false, transparent:true, backgroundColor:'#00000000', alwaysOnTop:true, hasShadow:false, resizable:false, fullscreenable:false, webPreferences:{preload:path.join(__dirname,'preload.cjs'), contextIsolation:true,nodeIntegration:false,sandbox:true} });
  win.setAlwaysOnTop(true,'screen-saver');
  win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});
  win.loadFile(path.join(__dirname, 'index.html')).catch(console.error);
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  win.webContents.on('will-navigate', e => e.preventDefault());
  timer = setInterval(() => {
    if (!hole || win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint(), b = win.getBounds();
    const next = !align && p.x-b.x>hole.x && p.x-b.x<hole.x+hole.width && p.y-b.y>hole.y && p.y-b.y<hole.y+hole.height;
    if (next !== ignored) { ignored = next; win.setIgnoreMouseEvents(next,{forward:true}); }
  }, 40);
  const bindings = { Up:'increase',Down:'decrease',R:'reset',H:'clean',A:'align',E:'erupt' };
  const failed = [];
  for (const [key,action] of Object.entries(bindings)) if (!globalShortcut.register(`CommandOrControl+Alt+${key}`,()=>send(action))) failed.push(key);
  if (!globalShortcut.register('CommandOrControl+Alt+Q',()=>app.quit())) failed.push('Q');
  win.webContents.once('did-finish-load',()=>win.webContents.send('shortcuts',failed));
  screen.on('display-metrics-changed',fit);
});
ipcMain.on('hole',(_e,value)=>{ if(value && ['x','y','width','height'].every(k=>Number.isFinite(value[k]))) hole=value; });
ipcMain.on('align',(_e,value)=>{align=Boolean(value);});
ipcMain.on('quit',()=>app.quit());
ipcMain.on('display',()=>{ displayIndex++; fit(); });
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{clearInterval(timer);globalShortcut.unregisterAll();});
}
