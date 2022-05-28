const { ipcRenderer, contextBridge } = require('electron');

// questi sono gli unici canali validi per amandare messaggi dalla pagina principale alle secondarie e viceversa
const validChannels = ["toMain", "myRenderChannel"];

// this variable contains information about favorite manga collected by the browser
let database = ''

// this is the standard manga format on the main page
const manga_format = `<div class='flex-element'>
                      <p><img src="{img}" width="300" height="300"></p>
                      <p class='link'><a href="{link}" target="_blank" rel="noopener noreferrer">{title}</a></p>
                      <p>{last_read}</p>
                      <p>{status}</p>
                      <p>{last_chapter}</p>
                      </div>`


// questa funzione rende i comandi qui sotto richiamabili dal file master.js
contextBridge.exposeInMainWorld(
  "api", {
  // used to send message from "master.js" to "main.js"
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // according to the choice shows the manga
  rend: (choice) => {
    let to_work = ''

    if (choice == 'all') {
      to_work = database

    } else {

      to_work = database.filter(
        (manga) => manga['status'] == choice

      )

    }

    rebuild_data( to_work )

  }

}
)

// when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain','load')
  
})

/*
ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {
    
  } 

})
*/

// when it receives the database from the browser, it copies the database 
// variable locally to be able to reuse it and starts the rebuild function
ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if ( String(args[0]).includes('dict_*') ) {

    document.getElementsByClassName('show_choice')[0].value = 'all'
    
    database = JSON.parse( String(args[0]).split('dict_*')[1] )

    rebuild_data( database )    

  } 

})

// given the array provided as argument create the html page
function rebuild_data(data) {

  let rebuilded_data = ''

  data.map(

    (manga) => {

      ipcRenderer.send('toMain', JSON.stringify(manga) )

      rebuilded_data += manga_format
      .replace( '{title}' , manga.title )
      .replace( '{title}' , manga.title )
      .replace( '{link}' , manga.link )
      .replace( '{img}' , manga.img )
      .replace( '{last_read}' , manga.last_read )
      .replace( '{status}' , manga.status )
      .replace( '{last_chapter}', manga.last_chapter )

    }

  )

  document.getElementsByClassName('table_generator')[0].innerHTML = rebuilded_data

}


