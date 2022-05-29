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

  // reports html changes in the option array
  change: (choice) => {
    if (prevent_change_option == 0) {

      if (option[choice] == false) {
        option[choice] = true

      } else {
        option[choice] = false

      }

    }

  },

  //sends the modified array option to main
  save: () => {
    ipcRenderer.send('toMain', 'save_option_*' + JSON.stringify(option));

  }

}
)

// when the array option is loaded the html file is "restored" by clicking all the modified 
// buttons to make the loaded array mirror. in this phase clicking the buttons must not cause 
// consequences to the array
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

    // receives the array with the options and loads them into the option variable
  } else if (String(args[0]).includes('option_file_*')) {

    option = JSON.parse(args[0].split('_*')[1])
    
    load_option()

  }

})

