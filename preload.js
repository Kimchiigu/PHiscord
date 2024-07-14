// preload.js

// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Add any Electron APIs you need to expose
  require: (module) => require(module),
  ipcRenderer: {
    send: (channel, data) => {
      let validChannels = ['show-notification'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
  },
});


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })