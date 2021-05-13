const { ipcRenderer, contextBridge } = require('electron');

// questi sono gli unici canali validi per amandare messaggi dalla pagina principale alle secondarie e viceversa
const validChannels = ["toMain", "myRenderChannel"];

// questa funzione serve per aggiornare la taballe presente nella pagina principale con i manga aggiunti tra i preferiti
function to_rend() {

  const path = require('path')
  const fs = require('fs')

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

// questa funzione rende i comandi qui sotto richiamabili dal file master.js
contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // controlla se i link inseriti nell'input sono validi, e se si tratta di un singolo capitolo o
  // della pagina principale di un manga
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
}
)

// crea la tabella quando la pagina main viene creata
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain','load')
  
})

// aggiorna la tabella a ogni variazione, fumetti aggiunti o rimossi
ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {
    to_rend()
    // cerca nuovi manga all'avvio
    document.getElementsByClassName('basicInputButtonsHyperlinksAccentButtonHover7c2a7e63')[0].click()
    
  } else if (args[0] == 'rend'){
    to_rend()
  }
})
