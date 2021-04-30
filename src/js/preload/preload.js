const { ipcRenderer, contextBridge } = require('electron');
const path = require('path')
const fs = require('fs')

const validChannels = ["toMain", "myRenderChannel"];

function to_rend() {
  let json = {
    raw: '',
    data: ''
  }

  let path_dir = path.join(__dirname, '..\\..')
  json.raw = fs.readFileSync(path_dir + '\\json\\fav.json');
  json.data = JSON.parse(fs.readFileSync(path_dir + '\\json\\fav.json'))

  document.getElementById('tab').innerHTML = Object.keys(json.data).map((v,index) => 
  
  "<tr><td id='name_manga'>{v}</td><td>.{del}</td></tr>"
  .replaceAll('.{del}', "<button type='button' id='del' onclick={del("+index+")}>Delete</button>")
  .replaceAll('{v}', v)
).join(' ')
}

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
      return '*e_r_r_o_r*'
    }
  },

  render: () => {
    to_rend()
  }
}
)

window.addEventListener('DOMContentLoaded', () => {
  to_rend()
})

ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'rend'){
    to_rend()
  }
})
