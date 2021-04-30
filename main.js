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

function load() {
  store.json.raw = fs.readFileSync(__dirname + '\\src\\json\\fav.json');
  store.json.data = JSON.parse(store.json.raw)
}
load()

function save() {
  store.tmp = JSON.stringify(JSON.sort(store.json.data))
  fs.writeFileSync(__dirname + '\\src\\json\\fav.json', store.tmp);
  load()
}

function isObject(v) {
  return '[object Object]' === Object.prototype.toString.call(v);
};

JSON.sort = function(o) {
if (Array.isArray(o)) {
      return o.sort().map(JSON.sort);
  } else if (isObject(o)) {
      return Object
          .keys(o)
      .sort()
          .reduce(function(a, k) {
              a[k] = JSON.sort(o[k]);

              return a;
          }, {});
  }

  return o;
}

function open_browser(type,link) {
  if (store.browser[type] == '') {
    store.browser[type] = new invisibleWindow_volume(link)
    store.browser[type]
  } else {
    store.browser[type].goto(link)
  }
}

class createWindow {
  constructor(){
    this.win = new BrowserWindow({
      width: 704,
      height: 528,
      //resizable: false,
      //maximizable: false,
      /*
      icon: __dirname + "\\src\\ico\\police.ico",
      */
      webPreferences: {
        preload: path.join(__dirname, '\\src\\js\\preload\\preload.js')
      }
    })
  
  this.win.webContents.openDevTools()
  // Disable the Menu
  this.win.setMenu(null)

  this.win.loadFile(__dirname + '\\src\\web\\home.html')
  }

  send(msg){
    this.win.webContents.send('myRenderChannel',msg)
  }
}

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

    ipcMain.on('toMain', (event, ...args) => {
      if (args[0] == 'quit') {

        if (store.to_do.length != 0) {
          if (store.to_do[0].includes('?style=list')) {
            this.win.loadURL(store.to_do[0])
          } else {
            this.win.loadURL(store.to_do[0] + '?style=list')
          }
          store.to_do.shift()
        } else if (store.to_do.length == 0) {
          dialog.showMessageBox(null, { type: 'info', title: 'mangaworld downloader', message: 'Download Complete!' })
          store.initialize()
          store.browser.main.send('rend')
          
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
      show: false,

      webPreferences: {
        preload: path.join(__dirname, '\\src\\js\\preload\\preload_volume.js')
      }
    })
    //this.win.webContents.openDevTools()
    this.win.loadURL(link)

    ipcMain.on('toMain', (event, ...args) => {
      if (args[0].includes('check_manga_*')) {
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
          event.returnValue = 0
        }
      }
    })
  }

  goto(link) {
    this.win.loadURL(link)
  }
}

ipcMain.handle('add_list', async (event, ...args) => {
  store.to_do.push(args[0])
})

// Is used to receive command from "master.js"
ipcMain.on('toMain', (event, ...args) => {
  let options = {
    type: 'info',
    title: 'mangaworld Manager',
  };

  if (args[0].includes('*e_r_r_o_r*')) {
    options.type = 'error'
    options.message = 'Please insert a valid mangaworld link'
    dialog.showMessageBox(null, options)

  } else if (args[0].includes('volume_*')) {

    if (args[0].includes('fav_*')) {
      store.check = 1
      store.tmp = args[0].replace('fav_*volume_*', '')
    } else if (args[0].includes('check_new_*')) {
      if (Object.keys(store.json.data).length != 0) {
        store.cycle = Object.keys(store.json.data).length - 1
        store.check = 2
      } else {
        options.type = 'error'
        options.message = 'There are no Manga favorites'
        dialog.showMessageBox(null, options)
      }
    }

    if (store.check != 2) {
      open_browser('volume',args[0].split('_*')[args[0].split('_*').length - 1])
      
    } else {
      open_browser('volume',store.json.data[Object.keys(store.json.data)[store.cycle]].link)
      
    }

  } else if (args[0].includes('start')) {
    if (store.check == 0) {
      if (store.browser.chapter == '') {
        store.browser.chapter = new invisibleWindow_chapter(store.to_do[0])
        store.browser.chapter
      } else {
        store.browser.chapter.goto(store.to_do[0])
      }
      store.to_do.shift()

    } else if (store.check == 1) {
      if (store.json.data[args[0].replace('start_*', '')] == undefined) {

        store.json.data[args[0].replace('start_*', '')] = {
          "link": store.tmp,
          "cap": store.to_do.length
        }

        save()
        options.message = 'Manga added!'
        dialog.showMessageBox(null, options)
        store.browser.main.send('rend')

      } else {
        options.type = 'error'
        options.message = 'this manga is already present'
        dialog.showMessageBox(null, options)
      }

    } else if (store.check == 2) {
      store.cycle -= 1
      if (store.cycle != -1) {
        store.browser.volume.goto(store.json.data[Object.keys(store.json.data)[store.cycle]].link)
      } else if (store.cycle == -1 && store.to_do.length != 0) {
        open_browser('chapter',store.to_do[0])
        store.to_do.shift()

      } else {
        options.message = 'Download Complete!'
        dialog.showMessageBox(null, options)
      }
    }

  } else if (args[0].includes('chapter_*')) {
    if (!args[0].includes('fav_*')) {
      open_browser('chapter',args[0].replace('chapter_*', ''))
      
    } else {
      options.type = 'error'
      options.message = 'Please insert a valid main page manga, not a chapter'
      dialog.showMessageBox(null, options)
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

  } else if (args[0].includes('del_*')) {

    let value = args[0].split('_*')[1]

    delete store.json.data[Object.keys(store.json.data)[value]]
    save()
    store.browser.main.send('rend')
    dialog.showMessageBox(null, { type: 'info', title: 'mangaworld downloader', message: 'Manga Successfully removed!' })

  }
})

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
