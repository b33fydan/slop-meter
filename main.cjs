const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('node:path');
let win, hole, timer, ignored = false, align = false, dragging = false, displayIndex = 0;
const send = action => win?.webContents.send('action', action);
function fit() { const displays = screen.getAllDisplays(); displayIndex %= displays.length; win.setBounds(displays[displayIndex].workArea); }
function updateMouseEvents(){
  if(!hole||!win||win.isDestroyed())return;
  const p=screen.getCursorScreenPoint(),b=win.getBounds(),edge=10;
  // Leave a small interactive strip around the opening for hover resizing.
  const next=!align&&!dragging&&p.x-b.x>hole.x+edge&&p.x-b.x<hole.x+hole.width-edge&&p.y-b.y>hole.y+edge&&p.y-b.y<hole.y+hole.height-edge;
  if(next!==ignored){ignored=next;win.setIgnoreMouseEvents(next,{forward:true});}
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
app.on('second-instance', () => { win?.show(); });
app.whenReady().then(() => {
  if(process.platform==='win32')app.setAppUserModelId('com.b33fydan.slop-meter');
  win = new BrowserWindow({ ...screen.getPrimaryDisplay().workArea, icon:path.join(__dirname,'assets/app-icon.png'), frame:false, transparent:true, backgroundColor:'#00000000', alwaysOnTop:true, hasShadow:false, resizable:false, fullscreenable:false, webPreferences:{preload:path.join(__dirname,'preload.cjs'), contextIsolation:true,nodeIntegration:false,sandbox:true,autoplayPolicy:'no-user-gesture-required'} });
  win.setAlwaysOnTop(true,'screen-saver');
  win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});
  win.loadFile(path.join(__dirname, 'index.html')).catch(console.error);
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  win.webContents.on('will-navigate', e => e.preventDefault());
  timer = setInterval(updateMouseEvents,40);
  const bindings = { Up:'increase',Down:'decrease',R:'reset',H:'clean',A:'align',E:'erupt' };
  const failed = [];
  for (const [key,action] of Object.entries(bindings)) if (!globalShortcut.register(`CommandOrControl+Alt+${key}`,()=>send(action))) failed.push(key);
  if (!globalShortcut.register('CommandOrControl+Alt+Q',()=>app.quit())) failed.push('Q');
  win.webContents.once('did-finish-load',()=>win.webContents.send('shortcuts',failed));
  screen.on('display-metrics-changed',fit);
});
ipcMain.on('hole',(_e,value)=>{ if(value && ['x','y','width','height'].every(k=>Number.isFinite(value[k]))){hole=value;updateMouseEvents();} });
ipcMain.on('align',(_e,value)=>{align=Boolean(value);updateMouseEvents();});
ipcMain.on('dragging',(_e,value)=>{dragging=Boolean(value);updateMouseEvents();});
ipcMain.on('quit',()=>app.quit());
ipcMain.on('display',()=>{ displayIndex++; fit(); });
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{clearInterval(timer);globalShortcut.unregisterAll();});
}
