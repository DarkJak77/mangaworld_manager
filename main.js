const { app, BrowserWindow, ipcMain, dialog, session, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const sound = require("sound-play");
const pup = require('./src/js/pup')

// easy edit value
const site = 'https://www.mangaworld.in/'
const class_fav = 'comics-flex justify-content-start bookmark'



// 0 = no account / 1 = account
let account = 0

// for fullscreen and resizable
const dev = 1;

const app_title = 'MangaWorld Manager'

var browser = ''
let main_page = ''

let slave = ''

let tmp = {}

let options = {
  type: 'info',
  title: app_title,
  message: '',
};


ipcMain.on('toMain', (event, ...args) => {
  if (args[0] == 'show_*') {
    browser.show()

  } else if (args[0] == 'hide_*') {
    browser.hide()

  }
})


// to send message use:
// dialog.showMessageBox(null, options)

/* to send sistem notification 

sound.play(path.join(__dirname, 'src/tmp/zuccotto.mp3'))
new Notification({
  title: options.title,
  body: 'STOP'
}).show();

*/

/*

base 

ipcMain.on('toMain', (event, ...args) => {
  if (args[0] == 'test') {
    console.log(args[0])

  }
})


*/

ipcMain.on('toMain', (event, ...args) => {
  if (args[0] == 'load_slave' && account == 0) {

    if (browser.check_page() == ( site + 'login' )) {
      console.log('not logged')

      dialog.showMessageBox(null, { type: 'info', title: 'MangaWorld Manager', 
      message: 'Benenuto! \nCome prima cosa collega il tuo Account \nSe non ne hai uno Crealo! ' })

      browser.show()

    } else if (browser.check_page().includes('bookmarks') ) {
      account = 1
      browser.saveCookie()

      browser.hide()
      browser.send('check_fav_*comics-flex justify-content-start bookmark')

      
    } else if (browser.check_page() == ( site + 'register' )) {
      //none
      
    } else {
      browser.goto(site + 'bookmarks' )
    
    }

  }
})

ipcMain.on('toMain', (event, ...args) => {
  console.log(args[0])
})


class createWindow {

  constructor(mode = 'slave') {
    this.mode = mode
    this.close = false

    if (this.mode == 'master') {

      this.win = new BrowserWindow({
        title: app_title,
        width: 800,
        height: 800,

        /*
        icon: path.join(__dirname, '/src/ico/manga.ico'),
        */

        webPreferences: {
          preload: path.join(__dirname, '/src/js/preload/preload.js')
        }
      })

      this.win.setPosition(0, 0)


      if (dev == 1) {
        this.win.resizable = true,
        this.win.fullscreenable = true
        //this.win.webContents.openDevTools();
      }


      /*
      // Disable the Menu
      win.setMenu(null)
      */

      this.win.loadFile('src/web/index.html')

    } else if (this.mode == 'slave') {
 
      this.win = new BrowserWindow({
        width: 800,
        height: 800,
        maximizable: true,
        show: false,

        webPreferences: {
          preload: path.join(__dirname, '/src/js/preload/preload_slave.js')
        } 

      })
      this.win.setPosition(500, 0)

      if (dev == 1) {
        this.win.resizable = true,
        this.win.fullscreenable = true
        //this.win.webContents.openDevTools();
      }

    }


    this.win.on('close', (event) => {

      this.confirmAndQuit(event)

    })

  }

  // Evita la chiusura dell'app se ci sono download in corso
  confirmAndQuit(e) {

    if (this.close == false) {
      e.preventDefault();
    }

    // dialog options
    const messageBoxOptions = {

      title: app_title,
      type: 'info',
      buttons: ['Exit', 'Wait up'],
      defaultId: 0,
      message: 'WIP'

    };

    if (0 != 0) {
      this.close = true

      // to delete data session 
      session.defaultSession.clearStorageData((data) => { })
      browser.close = true
      app.quit()

    } else {
      if (this.mode == 'slave') {
        this.hide()
      } else {
        //show the dialog
        dialog.showMessageBox(this.win, messageBoxOptions)
          .then(result => {
            if (result.response == 0) {
              // to delete data session 
              session.defaultSession.clearStorageData((data) => { })

              this.close = true
              browser.close = true
              app.quit()

            }
          })
      }
    }


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

        } else if (result.response === 1) {
          shell.openExternal('https://github.com/DarkJak77/')
        }
      }
      )
  }

  // usata per creare una barra per gli incarichi ( SPERIMENTALE )
  progress(value, max_value) {
    this.win.setProgressBar(
      ((value * 100) / max_value) / 100
    )
  }

  // usata per rimuovere la barra di progressione
  no_bar() {
    this.win.setProgressBar(0)
  }

  // riporta il titolo a quello originale
  title_default() {
    this.win.setTitle(app_title)
  }

  // cambia il titolo in base al numero di download rimanenti
  title_download() {
    this.win.setTitle('WIP')
  }

  // imposta un titolo personalizzato
  title(text) {
    this.win.setTitle(app_title + ' - ' + text)
  }

  check_page() {
    return this.win.webContents.getURL()
  }

  goto(link) {
    this.win.loadURL(link,{userAgent:'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36'})
  }

  delete_cookies() {
    this.src = path.join(__dirname, '/src/cookies/cookies.json')
    session.defaultSession.clearStorageData((data) => { })
    if (fs.existsSync(path.join(__dirname, this.src))) {
      fs.unlinkSync(path.join(__dirname, this.src))
    }
  }

  async load_coockie() {
    this.src = path.join(__dirname, '/src/cookies/cookies.json')
    if (fs.existsSync(this.src)) {
      if (fs.readFileSync(this.src, { encoding: 'utf8', flag: 'r' }) != '[]') {
        this.cookiesString = await fs.promises.readFile(this.src);
        this.cookies = JSON.parse(this.cookiesString);
        this.cookies.map((cookie) => session.defaultSession.cookies.set(cookie)
          .then(
           () => {}
          )
          .catch(
            (e) => console.log(e)
          )
        )

      }
    }
  }

  saveCookie() {
    this.url = this.check_page()
    session.defaultSession.cookies.get({})
      .then((cookies) => {
        if (cookies != []) {
          this.to_insert = cookies.map(
            (value) => {
              value.url = this.url
              return value
            }
          )
          fs.writeFileSync(path.join(__dirname, '/src/cookies/cookies.json'), JSON.stringify(this.to_insert, null, 2));
        }
      }).catch((error) => {
        console.log(error)
      })
  }

  eval(code) {
    this.win.webContents.executeJavaScript(code)
  }

  show() {
    this.win.show()
  }

  hide() {
    this.win.hide()
  }

  emulation() {
    this.win.webContents.enableDeviceEmulation({
      screenPosition: 'desktop',
      screenSize: { width: 1000, height: 1000 },
      viewSize: { width: 1000, height: 1000 },
      fitToView: true,
      deviceScaleFactor: 1,
    })
  }

  page_down() {
    this.win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'PageDown' })
  }


}

app.whenReady().then(() => {
  main_page = new createWindow('master')
  browser = new createWindow('slave')
  main_page
  browser

  
  browser.load_coockie()
  browser.goto(site + 'bookmarks')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      main_page = new createWindow('master')
      browser = new createWindow('slave')
      main_page
      browser

      
      browser.load_coockie()
      browser.goto(site + 'bookmarks')  

    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
