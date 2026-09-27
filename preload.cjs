const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('slop',{hole:r=>ipcRenderer.send('hole',r),align:v=>ipcRenderer.send('align',v),dragging:v=>ipcRenderer.send('dragging',v),quit:()=>ipcRenderer.send('quit'),display:()=>ipcRenderer.send('display'),onAction:fn=>ipcRenderer.on('action',(_e,a)=>fn(a)),onShortcuts:fn=>ipcRenderer.on('shortcuts',(_e,a)=>fn(a))});
