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
    let values = document.getElementsByClassName('hoverBorder631050db')[0].value
    if (values.includes('https://www.mangaworld.io/manga/') && values.includes('/read/')) {
      return 'chapter_*' + values
    } else if (values.includes('https://www.mangaworld.io/manga/')) {
      return 'volume_*' + values
    } else {
      return 'error'
    }
  }
}
)