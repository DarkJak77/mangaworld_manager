const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const request = require('request')

if (require('electron-squirrel-startup')) return app.quit();

let info = {
  title: '',
  volume: '',
  chapter: '',
  pre_link: ''
}

const download = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}

// Is used to receive command from "master.js"
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

  } else if (args[0].includes('ok_*')) {
    invisibleWindow(args[0].replace('ok_*', ''))

  } else if (args[0].includes('master_*')) {

    info = {
      title: args[0].split('_*')[1].replaceAll('?', '')
        .replaceAll('\\', '')
        .replaceAll('/', '')
        .replaceAll(':', '')
        .replaceAll('*', '')
        .replaceAll('"', '')
        .replaceAll('<', '')
        .replaceAll('>', '')
        .replaceAll('|', ''),
      volume: args[0].split('_*')[2],
      chapter: args[0].split('_*')[3],
      pre_link: args[0].split('_*')[4]
    }

  } else if (args[0].includes('dl_*')) {

    let value = args[0].split('_*')
    let dir = ''

    if (info.volume != 'none') {
      dir =  __dirname + '\\download\\' + info.title + '\\' + info.volume + '\\' + info.chapter + '\\'
    } else {
      dir = __dirname + '\\download\\' + info.title + '\\' + info.chapter + '\\'
    }

    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
    }

    let path = dir + value[1]

    const url = info.pre_link + value[1]
    download(url, path, () => {
    })

  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 557,
    height: 147,
    resizable: false,
    maximizable: false,

    /*
    resizable: false,
    fullscreenable: false,
    icon: __dirname + "\\src\\ico\\police.ico",
    */

    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }

    /*
  if (dev == 1) {
    option.resizable = true
    option.fullscreenable = true
  } else {
  }
  */

  })

  /*
  if (dev == 1) {
    win.webContents.openDevTools();
  }
  */
  //win.webContents.openDevTools()

  // Disable the Menu
  win.setMenu(null)


  win.loadFile(__dirname + '\\src\\web\\home.html')
}

function invisibleWindow(link) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    maximizable: true,
    show:false,

    webPreferences: {
      preload: path.join(__dirname, 'preload_chapter.js')
    }

  })

  //win.webContents.openDevTools()

  if (link.includes('?style=list')) {
    win.loadURL(link)
  } else {
    win.loadURL(link + '?style=list')
  }

  ipcMain.on('toMain', (event, ...args) => {
    if (args[0] == 'quit') {
  
      info = {
        title: '',
        volume: '',
        chapter: '',
        pre_link: ''
      }
      

      dialog.showMessageBox(null, option = {type: 'info',title: 'mangaworld downloader',message: 'Download Complete!'})

      win.close()
    }
  })

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