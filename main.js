const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const request = require('request')
const storage = require('./src/js/store.js')

// Questo fa si che quando apri la versione "Squirrel", il programma non venga aperto 2 volte 
if (require('electron-squirrel-startup')) return app.quit();

let store = new storage()

// Funzione per il Downlaod
const download = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}

// Serve per caricare il file json con le informazioni sui manga
function load() {
  store.json.raw = fs.readFileSync(__dirname + '\\src\\json\\fav.json');
  store.json.data = JSON.parse(store.json.raw)
  store.json.raw = ''
}

// Il primo caricamente del file json
load()

// salva le modifiche al file json
function save() {
  store.json.raw = JSON.stringify(JSON.sort(store.json.data))
  fs.writeFileSync(__dirname + '\\src\\json\\fav.json', store.json.raw);
  load()
}

// insieme alla funzione sottostante serve pe ordinare il file json per le key ( non è mai )
function isObject(v) {
  return '[object Object]' === Object.prototype.toString.call(v);
};

JSON.sort = function (o) {
  if (Array.isArray(o)) {
    return o.sort().map(JSON.sort);
  } else if (isObject(o)) {
    return Object
      .keys(o)
      .sort()
      .reduce(function (a, k) {
        a[k] = JSON.sort(o[k]);

        return a;
      }, {});
  }

  return o;
}

// Serve per creare e caricare i link dei browser.
// type == 'volume' || type == 'chapter'
function open_browser(type, link) {
  if (store.browser[type] == '') {
    if (type == 'volume') {
      store.browser[type] = new invisibleWindow_volume(link)
    } else {
      store.browser[type] = new invisibleWindow_chapter(link)
    }
    
    store.browser[type]
  } else {
    store.browser[type].goto(link)
  }
}

// questa classe gestisce la finestra principale
class createWindow {
  constructor() {
    this.win = new BrowserWindow({
      width: 704,
      height: 528,
      resizable: false,
      maximizable: false,

      icon: __dirname + "\\src\\ico\\manga.ico",
      
      webPreferences: {
        preload: path.join(__dirname, '\\src\\js\\preload\\preload.js')
      }
    })

    //this.win.webContents.openDevTools()
    // Disable the Menu
    this.win.setMenu(null)

    this.win.loadFile(__dirname + '\\src\\web\\home.html')
  }

  // serve per mandare messaggi dalla finestra principale alle secondarie
  send(msg) {
    this.win.webContents.send('myRenderChannel', msg)
  }

  // usata per il menù delle opzioni
  dialog(option) {
    dialog.showMessageBox(this.win, option)
      .then(result => {
        if (result.response === 0) {
          try {
            fs.mkdirSync(app.getPath('downloads') + '\\mangaworld Manager\\', { recursive: true });
          } catch (e) {
          }
          shell.openPath(app.getPath('downloads') + '\\mangaworld Manager\\')
        }
      }
      )
  }

  // usata per creare una barra per gli incarichi ( SPERIMENTALE )
  progress(value) {
    this.win.setProgressBar(
      ( ( value * 100 ) / store.tmp_value.to_do ) / 100
    )
  }

  no_bar() {
    this.win.setProgressBar(0)
  }

}

// questa classe gestisce la finestra che si occupa di controllare le pagine dei capitoli dei manga
class invisibleWindow_chapter {

  constructor(link) {
    this.win = new BrowserWindow({
      width: 800,
      height: 600,
      maximizable: true,
      show: false,

      webPreferences: {
        preload: path.join(__dirname, '\\src\\js\\preload\\preload_chapter.js')
      }
    })

    if (link.includes('?style=list')) {
      this.win.loadURL(link)
    } else {
      this.win.loadURL(link + '?style=list')
    }
  }

  goto(link) {
    this.win.loadURL(link)
  }
}

// questa classe gestisce la finestra che si occapa di controllare la presenza di nuovi capitoli, 
// reperire i link e aggiugnere ai preferiti
class invisibleWindow_volume {

  constructor(link) {
    this.win = new BrowserWindow({
      width: 800,
      height: 600,
      maximizable: true,
      show: false,

      webPreferences: {
        preload: path.join(__dirname, '\\src\\js\\preload\\preload_volume.js')
      }
    })

    this.win.loadURL(link)
  }

  goto(link) {
    this.win.loadURL(link)
  }
}

// aggiunge i link dei capitoli da scaricare
ipcMain.handle('add_list', async (event, ...args) => {
  store.to_do.push(args[0])
  store.tmp_value.to_do = store.to_do.length
})

// Is used to receive command from "master.js"
ipcMain.on('toMain', (event, ...args) => {
  let options = {
    type: 'info',
    title: 'mangaworld Manager',
  };


  if (args[0].includes('*e_r_r_o_r*')) { // quando viene inserito un link non valido appare un messaggio di errore

    options.type = 'error'
    options.message = 'Please insert a valid mangaworld link'
    dialog.showMessageBox(null, options)

  } else if (args[0].includes('how_to_*')) { // Richiama il menù con le spiegazioni e apre la cartella dei download
    let options = {}

    options.defaultId = 0, // bound to buttons array

      options.buttons = ['Open Download Directory', 'Exit']
    options.message =
      'DOWNLOAD: \n- Insert link of Chapter for single download or insert main page link of manga to download ALL CHAPTER\n' +
      'ADD TO FAVORITE: \n- Insert a main page link of manga to add in the favorite\n' +
      'CHECK NEW MANGA: \n- This function only work with a favorite manga, check if new chapter is published ad download automatically\n' +
      'OPTION: \n- Is above this text'

    store.browser.main.dialog(options)

  } else if (args[0].includes('del_*')) { // cancella un manga dalla lista dei preferiti

    // essendo lei key del json in ordine alfabetico, per trovarlo facilmente basta l'indice
    let value = args[0].split('_*')[1]

    delete store.json.data[Object.keys(store.json.data)[value]]
    save()
    store.browser.main.send('rend')

    options.message = 'Manga Successfully removed!'
    dialog.showMessageBox(null, options)

  } else if (args[0].includes('volume_*')) { // gestisce la finestra che controlla i volumi

    // se si è richiesto di aggiugnere un manga nei preferiti
    if (args[0].includes('fav_*')) {
      store.check = 1
      store.tmp = args[0].replace('fav_*volume_*', '')

      // quando si cerca nuovi capitoli
    } else if (args[0].includes('check_new_*')) {
      // controlla che ci siano effettivamente manga nei preferiti
      if (Object.keys(store.json.data).length != 0) {

        store.cycle = Object.keys(store.json.data).length - 1
        store.check = 2

      } else {
        options.type = 'error'
        options.message = 'There are no Manga favorites'
        dialog.showMessageBox(null, options)
        store.initialize()
      }
    }

    if (store.check == 2) {
      open_browser('volume', store.json.data[Object.keys(store.json.data)[store.cycle]].link)

    } else {
      // se non si sta cercando nuovi capitoli dei manga preferiti usa il link 
      open_browser('volume', args[0].split('_*')[args[0].split('_*').length - 1])

    }

  } else if (args[0].includes('start')) {  // richiamata quando il browser volume ha finito

    // se non è attiva nessuna modalità particolare
    if (store.check == 0) {
      open_browser('chapter', store.to_do[0])
      store.to_do.shift()

    } else if (store.check == 1) { // se si sta cercando di aggingere un manga nei preferiti
      // controlla se il manga non sia già inserito
      if (store.json.data[args[0].replace('start_*', '')] == undefined) {

        store.json.data[args[0].replace('start_*', '')] = {
          "link": store.tmp,
          "cap": store.to_do.length
        }

        save()

        options.message = 'Manga added!'
        dialog.showMessageBox(null, options)
        store.browser.main.send('rend')
        store.initialize()

      } else {
        options.type = 'error'
        options.message = 'this manga is already present'
        dialog.showMessageBox(null, options)
        store.initialize()
      }


    } else if (store.check == 2) { // se si stanno cercando nuovi capitoli dei manga preferiti
      store.cycle -= 1

      // se ci sono ancora manga da controllare
      if (store.cycle != -1) {

        store.browser.volume.goto(store.json.data[Object.keys(store.json.data)[store.cycle]].link)

      } else if (store.cycle == -1 && store.to_do.length != 0) { // se sono finiti i manga ma bisogna scaricare dei capitoli
        open_browser('chapter', store.to_do[0])
        store.to_do.shift()

      } else {
        options.message = 'Download Complete!'
        dialog.showMessageBox(null, options)
        store.initialize()
      }
    }

  } else if (args[0].includes('chapter_*')) { // gestisce la finestra che controlla i capitoli
    if (!args[0].includes('fav_*')) { // verifica che non sia in modalità aggiungi favoriti
      open_browser('chapter', args[0].replace('chapter_*', ''))

    } else {
      options.type = 'error'
      options.message = 'Please insert a valid main page manga, not a chapter'
      dialog.showMessageBox(null, options)
      store.initialize()
    }


  } else if (args[0].includes('master_*')) { // per evitare messaggi lunghi riportanti sempre le stesse informazioni con poche modifiche
    // salva le informazioni e, nelle successive chiamate, il messaggio contentuto sarà solo 
    // l'end link

    store.info = {
      title: args[0].split('_*')[1].replaceAll('?', '')
        .replaceAll('\\', '')
        .replaceAll('/', '')
        .replaceAll(':', '')
        .replaceAll('*', '')
        .replaceAll('"', '')
        .replaceAll('<', '')
        .replaceAll('>', '')
        .replaceAll('|', '')
        .trim(),
      volume: args[0].split('_*')[2],
      chapter: args[0].split('_*')[3],
      pre_link: args[0].split('_*')[4]
    }

  } else if (args[0].includes('dl_*')) { // scarica il manga

    let value = args[0].split('_*')
    let dir = ''

    if (store.info.volume != 'none') {
      dir = app.getPath('downloads') + '\\mangaworld Manager\\' + store.info.title + '\\' + store.info.volume + '\\' + store.info.chapter + '\\'
    } else {
      dir = app.getPath('downloads') + '\\mangaworld Manager\\' + store.info.title + '\\' + store.info.chapter + '\\'
    }

    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
    }

    let path = dir + value[1]

    const url = store.info.pre_link + value[1]
    download(url, path, () => {
    })

  } else if (args[0].includes('check_manga_*')) { // usata quando si cercano nuovi capitoli dei manga preferiti
    if (store.check == 2) {
      let old_value = store.json.data[args[0].split('_*')[1]].cap
      store.json.data[args[0].split('_*')[1]].cap = parseInt(args[0].split('_*')[2])
      event.returnValue = old_value
      if ((parseInt(args[0].split('_*')[2]) - old_value) != 0) {
        dialog.showMessageBox(null, {
          type: 'info',
          title: 'mangaworld downloader',
          message: 'I found ' + (parseInt(args[0].split('_*')[2]) - old_value) + ' new chapter of ' + args[0].split('_*')[1]
        })
      }

      save()
    } else {
      // in questo modo il preload_volume elaborerà tutti i link non escudendone nessuno
      event.returnValue = 0
    }
  } else if (args[0] == 'quit') { // usata quando il browser chapter ha concluso il suo lavoro

    // ?style=list alla fine del link serve per la visualizzazione lista delle immagini, in modo da
    // acquisire i link celermente
    if (store.to_do.length != 0) {
      if (store.to_do[0].includes('?style=list')) {
        store.browser.chapter.goto(store.to_do[0])
      } else {
        store.browser.chapter.goto(store.to_do[0] + '?style=list')
      }
      store.browser.main.progress(store.tmp_value.do)
      store.to_do.shift()
      store.tmp_value.do += 1
    } else if (store.to_do.length == 0) {
      dialog.showMessageBox(null, { type: 'info', title: 'mangaworld downloader', message: 'Download Complete!' })
      store.initialize()
      store.browser.main.send('rend')
      store.browser.main.no_bar()

    }
  }
}
)

app.whenReady().then(() => {
  store.browser.main = new createWindow()
  store.browser.main

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
