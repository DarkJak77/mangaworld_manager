const { ipcRenderer, contextBridge } = require('electron');

// questi sono gli unici canali validi per amandare messaggi dalla pagina principale alle secondarie e viceversa
const validChannels = ["toMain", "myRenderChannel"];

// questa funzione rende i comandi qui sotto richiamabili dal file master.js
contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

}
)

// when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain','load')
  
})


ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {
    
  } 
})



