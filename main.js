const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const request = require('request')
const storage = require('./src/js/store.js')

if (require('electron-squirrel-startup')) return app.quit();

let store = new storage()

const download = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}

ipcMain.handle('add_list', async (event, ...args) => {
  store.store.to_do.push(args[0])
})

// Is used to receive command from "master.js"
//ipcMain.setMaxListeners(999)
ipcMain.on('toMain', (event, ...args) => {
  let options = {
    type: 'info',
    title: 'mangaworld downloader',
    message: args[0],
  };

  if (args[0] == 'error') {
    options.type = 'error'
    options.message = 'Please insert a valid mangaworld link'
    dialog.showMessageBox(null, options)

  } else if (args[0] == 'start') {
    if (store.browser.chapter == '') {
      store.browser.chapter = new invisibleWindow_chapter(store.to_do[0])
      store.browser.chapter
    } else {
      store.browser.chapter.goto(store.to_do[0])
    }    
    store.to_do.shift()
  } else if (args[0].includes('chapter_*')) {
    if (store.browser.chapter == '') {
      store.browser.chapter = new invisibleWindow_chapter(args[0].replace('chapter_*', ''))
      store.browser.chapter
    } else {
      store.browser.chapter.goto(args[0].replace('chapter_*', ''))
    }

  } else if (args[0].includes('volume_*')) {
    if (store.browser.volume == '') {
      store.browser.volume = new invisibleWindow_volume(args[0].replace('volume_*', ''))
      store.browser.volume
    } else {
      store.browser.volume.goto(args[0].replace('volume_*', ''))
    }
    

  } else if (args[0].includes('master_*')) {

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

  } else if (args[0].includes('dl_*')) {

    let value = args[0].split('_*')
    let dir = ''

    if (store.info.volume != 'none') {
      dir = __dirname + '\\download\\' + store.info.title + '\\' + store.info.volume + '\\' + store.info.chapter + '\\'
    } else {
      dir = __dirname + '\\download\\' + store.info.title + '\\' + store.info.chapter + '\\'
    }

    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
    }

    let path = dir + value[1]

    const url = store.info.pre_link + value[1]
    download(url, path, () => {
    })

  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 704,
    height: 528,
    resizable: false,
    maximizable: false,
    /*
    icon: __dirname + "\\src\\ico\\police.ico",
    */
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  //win.webContents.openDevTools()
  // Disable the Menu
  win.setMenu(null)

  win.loadFile(__dirname + '\\src\\web\\home.html')
}



class invisibleWindow_chapter {

  constructor(link) {
    this.win = new BrowserWindow({
      width: 800,
      height: 600,
      maximizable: true,
      //show: false,
  
      webPreferences: {
        preload: path.join(__dirname, 'preload_chapter.js')
      }
    })
  
    if (link.includes('?style=list')) {
      this.win.loadURL(link)
    } else {
      this.win.loadURL(link + '?style=list')
    }
  
    ipcMain.on('toMain', (event, ...args) => {
      if (args[0] == 'quit') {
  
        store.info = {
          title: '',
          volume: '',
          chapter: '',
          pre_link: ''
        }
  
        if (store.to_do.length != 0) {
          if (store.to_do[0].includes('?style=list')) {
            this.win.loadURL(store.to_do[0])
          } else {
            this.win.loadURL(store.to_do[0] + '?style=list')
          }
          store.to_do.shift()
        } else if (store.to_do.length == 0) {
          dialog.showMessageBox(null, { type: 'info', title: 'mangaworld downloader', message: 'Download Complete!' })
        }
      }
    })
  } 

  goto(link) {
    this.win.loadURL(link)
  }
}

class invisibleWindow_volume {

  constructor(link) {
    this.win = new BrowserWindow({
        width: 800,
        height: 600,
        maximizable: true,
        //show: false,

        webPreferences: {
          preload: path.join(__dirname, 'preload_volume.js')
        }
      })

      this.win.loadURL(link)
  }
  
  goto(link) {
    this.win.loadURL(link)
  }

}



app.whenReady().then(() => {
  createWindow()

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