const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Send (no return, for fire-and-forget)
  send: (channel, data) => ipcRenderer.send(channel, data),

  // Listen for events
  on: (channel, callback) =>
    ipcRenderer.on(channel, (event, ...args) => callback(...args)),

  // Call and await results from main (added)
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
