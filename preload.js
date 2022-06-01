const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // when the app is started, "provincia" and "comune" <select> is make
  auto: () => {
    window.addEventListener('DOMContentLoaded', () => {
      //
    })
  }
}
)