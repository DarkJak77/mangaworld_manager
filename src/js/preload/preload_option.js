const { ipcRenderer, contextBridge }  = require('electron');


/*
const DOMParser = require('dom-parser')
let element = new DOMParser().parseFromString(tmp_value, "text/xml");
*/

const validChannels = ["toMain", "myRenderChannel"];

let option = {
  'auto_update_on_start' : false,
  'complete_skip' : false,
  'drop_skip' : false,
  'stop_skip' : false,
  'to_read' : false
}

contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  change : (choice) => {
    if (option[choice] == false ) {
      option[choice] = true

    } else {
      option[choice] = false

    }

  },

  save : () => {
    ipcRenderer.send('toMain', 'save_option_*' + JSON.stringify(option));

  }

}
)


function load_option(loaded_option) {
  Object.values( loaded_option ).map(
    (sw,i) => {

      if(sw == true) {
        document.getElementsByTagName('input')[i].click()

      }

    } 

  )

}


// when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain', 'load_option')


})


ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {

  } else if ( String(args[0]).includes('option_file_*') ) {

    load_option( JSON.parse( args[0].split('_*')[1] ) )

  }

})

