const { app, BrowserWindow, ipcMain, dialog, session, Notification, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const sound = require("sound-play");
const pup = require('./src/js/pup')




/*
BROWSER VARIABLES
*/


let main_page = ''
let browser_page = ''
let option_page = ''




/*
VARIABLES
*/

// easy edit value
const app_title = 'MangaWorld Manager'
const site = 'https://www.mangaworld.in/'

// this is the container class of favorite manga
const class_fav = 'entry vertical bookmark'

// this is a manga class's 
const chapter_class = 'chapter'
let config = {
  'auto_update_on_start' : false,
  'complete_skip' : false,
  'drop_skip' : false,
  'stop_skip' : false,
  'to_read_skip' : false
}

// 0 = no account / 1 = account
let account = 0

// for fullscreen and resizable
const dev = 1;

let database = {}
let tmp = ''
let command = ''
let working = 0
let work_time = 1

// for message
let options = {
  type: 'info',
  title: app_title,
  message: '',
};




/*
LISTENER
*/

// must 
ipcMain.on('toMain', (event, ...args) => {
  if ( args[0] == 'load') {
    load_opt()

  } else if (args[0] == 'show_*') {
    browser_page.show()

  } else if (args[0] == 'hide_*') {
    browser_page.hide()

  } else if (args[0] == 'option_*') {

    options.defaultId = 2,


    options.buttons = ['Option', 'Developer Page', 'Exit']
    options.message =
      'OPTION: \n- Is above this text\n' +
      'DEVELOPER PAGE: \n- Click on that button to open developer page\n'

    main_page.dialog(options,() => {call_option()})

  }
})

// login and register
ipcMain.on('toMain', (event, ...args) => {

  // this series of functions is used to connect to 
  // an account if the cookies are invalid or not present

  if (args[0] == 'load_slave' && account == 0) {

    // if it does not detect the account, the browser screen appears 
    // in order to connect and / or create a new account

    if (browser_page.check_page() == (site + 'login')) {
      console.log('not logged')

      dialog.showMessageBox(null, {
        type: 'info', title: 'MangaWorld Manager',
        message: 'Benenuto! \nCome prima cosa collega il tuo Account \nSe non ne hai uno Crealo! '
      })

      browser_page.show()

    } else if (browser_page.check_page().includes('bookmarks')) {

      // if it detects the account, it looks for your favorite manga

      account = 1
      browser_page.saveCookie()

      browser_page.hide()
      browser_page.send('check_fav_*' + class_fav)


    } else if (browser_page.check_page() == (site + 'register')) {

      // the program gives the possibility to create an account

    } else {

      // if it does not detect the account at each refresh it tries to connect to 
      // the favorites page in order to check if the account has been entered

      browser_page.goto(site + 'bookmarks')

    }

  } 

  // it is used when looking for the last read chapter of your favorite manga

  else if (args[0] == 'load_slave' && account == 1 && command == 'check_last_chapter' ) {

    browser_page.send('check_last_chapter_*' + chapter_class)
    command = ''

  }
})

// render page to main
ipcMain.on('toMain', (event, ...args) => {

  // this function is used to forward the manga 
  // list from the browser to the main page

  if (String(args[0]).includes('dict_*')) {

    database = JSON.parse( args[0].split('_*')[1] )

    main_page.send(args[0])

    if ( config.auto_update_on_start == true ) {
      update_manga()

    }

  }

})

// option page 
ipcMain.on('toMain', (event, ...args) => {
  if ( args[0] == 'load_option') {

    load_opt()

    option_page.send('option_file_*' + JSON.stringify( config ) )

  } else if ( String(args[0]).includes('save_option_*') ) {

    config = JSON.parse( args[0].split('_*')[1] )
    fs.writeFileSync(path.join(__dirname, '/src/config/config.json'), args[0].split('_*')[1] )

    dialog.showMessageBox(null, {
      type: 'info', title: 'MangaWorld Manager',
      message: 'Preferenze salvate con successo!'
    })

  }

})

// update 
ipcMain.on('toMain', (event, ...args) => {

  if ((args[0]) == 'update_*') {

    update_manga()

  } else if ( String(args[0]).includes('check_last_chapter_result_*') ) {

    check_last_chapter_result(args[0].split('_*')[1])

  }

})

// debug show message
ipcMain.on('toMain', (event, ...args) => {
  
  if ( String( args[0] ).includes('db_*')  ) {

     console.log(args[0]) 

  }
  
})




/*
FUNCTION
*/

// this function is used to load the config.json file. 

function load_opt() {

  // If it is not present, a standard is created

  if (! (fs.existsSync(path.join(__dirname, '/src/config/config.json'))) ) {

    fs.writeFileSync(path.join(__dirname, '/src/config/config.json'),JSON.stringify(config))

  } else {

    config = JSON.parse( fs.readFileSync(path.join(__dirname, '/src/config/config.json')) )

  }

}

// this function open a option page

function call_option() {
  option_page = new createWindow('option')
  option_page

}

// this function is used to choose which manga to update

function update_manga() {
  tmp = []

    database.map(

      (manga) => {

        if (config.complete_skip == true && manga.status == 'complete') {
          //

        } else if (config.drop_skip == true && manga.status == 'drop') {
          //

        } else if (config.stop_skip == true && manga.status == 'stop') {
          //

        } else if (config.complete_skip == true && manga.status == 'complete') {
          //

        } else if (config.to_read_skip == true && manga.status == 'to_read') {
          //

        } else {
          tmp.push(manga)

        }

      }


    )
    
    // these variables are used for the status bar ( does not work in linux )

    working = tmp.length
    main_page.progress(work_time,working)
    main_page.title('Updating....   '+work_time+'/'+working)

    new Notification({
      title: app_title,
      body: 'Start Scan for Updates'
    }).show();

    check_last_chapter()

}

// This is a loop: as long as the tmp array is not empty 
// it continues to send links to the browser

function check_last_chapter() {

  if ( tmp.length != 0 ) {

    command = 'check_last_chapter'
    browser_page.goto( tmp[0].link )

  } else {
    main_page.send('dict_*' + JSON.stringify(database))
    main_page.no_bar()
    main_page.title_default()
    work_time = 1
    working = 0

    new Notification({
      title: app_title,
      body: 'Scanning Completed!'
    }).show();

    // When it finishes updating it unlocks the "With chapters to read" option
    main_page.send('unlock')

  }

}

// this function is used to update the database with 
// the new values collected (last chapter read)

function check_last_chapter_result(found_value) {
  let to_find = tmp[0].title

    database.map(
      (manga,index) => {

        if(manga.title == to_find) {
          database[index].last_chapter = found_value

        }

      }

    )

    tmp.shift()
    work_time++
    main_page.progress(work_time,working)
    main_page.title('Updating....   '+work_time+'/'+working)

    check_last_chapter()

}


/*
CLASS
*/

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

    } else if (this.mode == 'option') {

      this.win = new BrowserWindow({
        title: app_title + '- Option Page',
        width: 400,
        height: 275,
        maximizable: false,
        show: true,

        webPreferences: {
          preload: path.join(__dirname, '/src/js/preload/preload_option.js')
        }

      })
      
      this.win.setMenu(null)
      this.win.setPosition(500, 0)

      if (dev == 1) {
        this.win.resizable = true,
        this.win.fullscreenable = true
        //this.win.webContents.openDevTools();
      }

      this.win.loadFile('src/web/option.html')

    }

    if (this.mode != 'option') {

      this.win.on('close', (event) => {

      this.confirmAndQuit(event)

    })

    }

    

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

    /*
    if (0 != 0) {
      this.close = true

      // to delete data session 
      session.defaultSession.clearStorageData((data) => { })
      browser.close = true
      app.quit()

    } else {
      */

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
            browser_page.close = true
            app.quit()

          }
        })
    }
   // }


  }

  // serve per mandare messaggi dalla finestra principale alle secondarie
  send(msg) {
    this.win.webContents.send('myRenderChannel', msg)
  }

  // usata per il menù delle opzioni
  dialog(option, fn_1, fn_2, fn_3) {
    dialog.showMessageBox(this.win, option)
      .then(result => {
        if (result.response === 0) {
          if ( fn_1 != undefined ) {
            fn_1()

          } else {
            //

          } 

        } else if (result.response === 1) {
          // Usually Developer Page Button

          if ( fn_2 != undefined ) {
            fn_2()

          } else {
            shell.openExternal('https://github.com/DarkJak77/')

          } 

        } else if (result.response === 2) {
          // Usually Exit Button

          if ( fn_3 != undefined ) {
            fn_3()

          } else {
            //

          }

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
    this.win.loadURL(link)//, { userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36' })
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
            () => { }
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




/*
TO START
*/

app.whenReady().then(() => {
  main_page = new createWindow('master')
  browser_page = new createWindow('slave')
  main_page
  browser_page


  browser_page.load_coockie()
  browser_page.goto(site + 'bookmarks')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      main_page = new createWindow('master')
      browser_page = new createWindow('slave')
      main_page
      browser_page


      browser_page.load_coockie()
      browser_page.goto(site + 'bookmarks')

    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})



/*
DEAD CODE
*/

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