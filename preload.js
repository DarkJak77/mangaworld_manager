const { ipcRenderer, contextBridge } = require('electron');

const validChannels = ["toMain", "myRenderChannel"];

contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  check: () => {
    let values = document.getElementsByClassName('hoverBordera85828e0')[0].value
    if (values.includes('https://www.mangaworld.io/manga/')){
      return 'ok_*'+values
    } else {
      return 'error'
    }
  }
}
)