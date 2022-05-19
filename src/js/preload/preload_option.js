const { ipcRenderer, contextBridge } = require('electron');


/*
const DOMParser = require('dom-parser')
let element = new DOMParser().parseFromString(tmp_value, "text/xml");
*/

const validChannels = ["toMain", "myRenderChannel"];

let option = {}

// 0 == change / 1 == no_change
let prevent_change_option = 0

contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  change: (choice) => {
    if (prevent_change_option == 0) {

      if (option[choice] == false) {
        option[choice] = true

      } else {
        option[choice] = false

      }

    }
  },

  save: () => {
    ipcRenderer.send('toMain', 'save_option_*' + JSON.stringify(option));

  }

}
)


function load_option() {
  prevent_change_option = 1

  Object.values(option).map(
    (sw, i) => {

      if (sw === true) {
        document.getElementsByTagName('input')[i].click()

      }

    }

  )

  prevent_change_option = 0

}


// when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain', 'load_option')


})


ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {

  } else if (String(args[0]).includes('option_file_*')) {

    option = JSON.parse(args[0].split('_*')[1])
    
    load_option()

  }

})

