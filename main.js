const { app, BrowserWindow, ipcMain, dialog, session, Notification, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')



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

// this is link for my github to get mangaworld site link
let site_url = 'https://raw.githubusercontent.com/DarkJak77/mangaworld_manager/40319539d5aded3699ad4688d45f270d8197ca76/site_link.json'

// 0 == normal / 1 == adult
let site = []

// this is the container class of favorite manga
const class_fav = 'entry vertical bookmark'

// this is a manga class's 
const chapter_class = 'chapter'
let config = {
  'auto_update_on_start': false,
  'complete_skip': false,
  'complete_not_show': false,
  'drop_skip': false,
  'drop_not_show': false,
  'stop_skip': false,
  'stop_not_show': false,
  'to_read_skip': false,
  'to_read_not_show': false,
  'sfw': true
}

// 0 = no account / 1 = account
let account = 0

// for fullscreen and resizable
const dev = 0

let database = {}
let tmp = ''
let command = ''

// 0 = not working / 1 = working
let engaged = 0

// 0 = base / 1 = hot
let site_mode = 0
let user_id = ''

// 0 = to update / 1 = finish first update
let first_update = 0

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
  if (args[0] == 'load') {
    load_opt()
    main_page.send('option_file_*' + JSON.stringify(config))

  } else if (args[0] == 'show_*') {
    browser_page.show()

  } else if (args[0] == 'hide_*') {
    browser_page.hide()

  } else if (args[0] == 'option_*') {

    // fix close
    options.defaultId = 2,


      options.buttons = ['Option', 'Developer Page', 'Exit']
    options.message =
      'OPTION: \n- Is above this text\n' +
      'DEVELOPER PAGE: \n- Click on that button to open developer page\n'

    main_page.dialog(options, () => { call_option() })

  }
})

// login and register
ipcMain.on('toMain', (event, ...args) => {

  // this series of functions is used to connect to 
  // an account if the cookies are invalid or not present

  if (args[0] == 'load_slave') {

    if (account == 0) {

      // if it does not detect the account, the browser screen appears 
      // in order to connect and / or create a new account

      if (browser_page.check_page() == (site[site_mode] + 'login')) {

        dialog.showMessageBox(null, {
          type: 'info', title: app_title,
          message: 'Benenuto! \nCome prima cosa collega il tuo Account \nSe non ne hai uno Crealo! '
        })

        browser_page.show()

      } else if (browser_page.check_page().includes('bookmarks')) {

        // if it detects the account, it looks for your favorite manga

        if (site_mode == 0) {

          user_id = browser_page.check_page().split('bookmarks/')[1]

          browser_page.send('check_fav_*' + class_fav)

        } else if (site_mode == 1) {

          account = 1

          browser_page.saveCookie()

          browser_page.send('check_fav_*' + class_fav)

          browser_page.hide()

        }

      } else if (browser_page.check_page() == (site[site_mode] + 'register')) {

        // the program gives the possibility to create an account

      } else {

        // if it does not detect the account at each refresh it tries to connect to 
        // the favorites page in order to check if the account has been entered

        browser_page.goto(site[site_mode] + 'bookmarks/' + user_id)

      }

    } else if (account == 1) {

      if (command == 'reload') {

        browser_page.send('check_fav_*' + class_fav)

        // it is used when looking for the last read chapter of your favorite manga

      } else if (command == 'check_last_chapter') {

        browser_page.send('check_last_chapter_*' + chapter_class)
        command = ''

      }
    }

  }


})

// render page to main
ipcMain.on('toMain', (event, ...args) => {

  // this function is used to forward the manga 
  // list from the browser to the main page

  if (String(args[0]).includes('dict_*')) {

    if (site_mode == 1) {

      send_manga_list(args)

    } else if (site_mode == 0 && account == 0) {

      database = JSON.parse(args[0].split('_*')[1])

      site_mode = 1

      if (config['sfw'] == true) {

        send_manga_list(args = null)

      } else {

        browser_page.goto(site[site_mode] + 'bookmarks/' + user_id)

      }


    } else if (site_mode == 0 && account == 1 && command == 'reload') {

      database = JSON.parse(args[0].split('_*')[1])

      site_mode = 1

      if (config['sfw'] == true) {

        send_manga_list(args = null)

      } else {

        browser_page.goto(site[site_mode] + 'bookmarks/' + user_id)

      }

    }

  }

})

// option page 
ipcMain.on('toMain', (event, ...args) => {
  if (args[0] == 'load_option') {

    load_opt()

    option_page.send('option_file_*' + JSON.stringify(config))

  } else if (String(args[0]).includes('save_option_*')) {

    if (JSON.stringify(config) != args[0].split('_*')[1]) {

      config = JSON.parse(args[0].split('_*')[1])
      fs.writeFileSync(path.join(__dirname, '/src/config/config.json'), args[0].split('_*')[1])

      main_page.send('option_file_*' + JSON.stringify(config))

    }

    dialog.showMessageBox(null, {
      type: 'info', title: app_title,
      message: 'Preferenze salvate con successo!'
    })

  }

})

// update 
ipcMain.on('toMain', (event, ...args) => {

  if ((args[0]) == 'update_*') {

    if (engaged == 0) {

      if (account == 1) {

        // check your favorite manga first and then check for updates

        engaged = 1
        command = 'reload'
        site_mode = 0
        database = {}

        // reload page before search new chapter

        main_page.title('Reloading...')
        browser_page.goto(site[site_mode] + 'bookmarks/' + user_id)

      } else {

        dialog.showMessageBox(null, {
          type: 'error', title: app_title,
          message: 'Non hai un account!'
        })

      }

    } else {

      dialog.showMessageBox(null, {
        type: 'error', title: app_title,
        message: 'Attendi che l\'operazione precedente termini'
      })

    }



  } else if (String(args[0]).includes('check_last_chapter_result_*')) {

    check_last_chapter_result(args[0].split('_*')[1])

  }

})

// debug show message
ipcMain.on('toMain', (event, ...args) => {

  /*
  if ( String( args[0] ).includes('db_*')  ) {

    //console.log(args[0]) 

  }
  */

  //console.log(args[0])

})



/*
FUNCTION
*/

// this function is used to load the config.json file. 

function load_opt() {

  // If it is not present, a standard is created

  if (!(fs.existsSync(path.join(__dirname, '/src/config/config.json')))) {

    fs.writeFileSync(path.join(__dirname, '/src/config/config.json'), JSON.stringify(config))

  } else {

    config = JSON.parse(fs.readFileSync(path.join(__dirname, '/src/config/config.json')))

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

  command = ''

  // these variables are used for the status bar ( does not work in linux )

  working = tmp.length
  main_page.progress(work_time, working)
  main_page.title('Updating....   ' + work_time + '/' + working)


  new Notification({
    title: app_title,
    body: 'Start Scan for Updates'
  }).show();

  check_last_chapter()

}

// This is a loop: as long as the tmp array is not empty 
// it continues to send links to the browser

function check_last_chapter() {

  if (tmp.length != 0) {

    command = 'check_last_chapter'
    browser_page.goto(tmp[0].link)

  } else {
    main_page.send('dict_*' + JSON.stringify(database))
    main_page.no_bar()
    main_page.title_default()
    work_time = 1
    working = 0
    engaged = 0

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
    (manga, index) => {

      if (manga.title == to_find) {
        database[index].last_chapter = found_value

      }

    }

  )

  tmp.shift()
  work_time++
  main_page.progress(work_time, working)
  main_page.title('Updating....   ' + work_time + '/' + working)

  check_last_chapter()

}


// this function is used when the final dict comes from 
// the slave, is rendered or the update function is executed 
function send_manga_list(args) {

  // when use SFW function this pass is skipped, so to set up 
  // the account we propose it again here
  if (account == 0) {

    account = 1

    browser_page.saveCookie()

    browser_page.hide()

  }

  let db = []

  database.map(x => db.push(x))

  if (args != null) {

    JSON.parse(args[0].split('_*')[1]).map(x => db.push(x))

  }


  // CREDIT https://stackoverflow.com/questions/35576041/sort-json-by-value
  database = db.sort(function (a, b) {
    return a.title.localeCompare(b.title);
  });

  // CREDIT UP

  if (command != 'reload') {

    main_page.send('dict_*' + JSON.stringify(database))

  } else if (command == 'reload' && site_mode == 1) {
    site_mode = 0
    update_manga()

  }

  if (config.auto_update_on_start == true && first_update == 0) {
    first_update = 1

    update_manga()

  }

}

// this funciton get the mangaworld link from my github
async function get_link() {

  const response = await fetch(site_url);
  const data = await response.json()

  site[0] = data['normal']
  site[1] = data['adult']

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
        resizable: true,
        maximizable: true,


        icon: path.join(__dirname, '/src/ico/manga.ico'),


        webPreferences: {
          preload: path.join(__dirname, '/src/js/preload/preload.js')
        }
      })

      this.win.setPosition(0, 0)

      // Disable the Menu
      this.win.setMenu(null)

      this.win.loadFile('src/web/index.html')

    } else if (this.mode == 'slave') {

      this.win = new BrowserWindow({
        width: 800,
        height: 800,
        maximizable: true,
        show: false,
        resizable: true,

        icon: path.join(__dirname, '/src/ico/manga.ico'),

        webPreferences: {
          preload: path.join(__dirname, '/src/js/preload/preload_slave.js')
        }

      })

      this.win.setPosition(500, 0)

    } else if (this.mode == 'option') {

      this.win = new BrowserWindow({
        title: app_title + '- Option Page',
        width: 400,
        height: 510,
        maximizable: false,
        show: true,

        icon: path.join(__dirname, '/src/ico/manga.ico'),

        webPreferences: {
          preload: path.join(__dirname, '/src/js/preload/preload_option.js')
        }

      })

      this.win.setPosition(500, 0)

      if (dev == 1) {
        this.win.resizable = true,
          this.win.fullscreenable = true
        //this.win.webContents.openDevTools();
      }

      this.win.loadFile('src/web/option.html')

      // Disable the Menu
      this.win.setMenu(null)

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
      message: 'Are you sure you want to quit the app?'

    };

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
          if (fn_1 != undefined) {
            fn_1()

          } else {
            //

          }

        } else if (result.response === 1) {
          // Usually Developer Page Button

          if (fn_2 != undefined) {
            fn_2()

          } else {
            shell.openExternal('https://github.com/DarkJak77/')

          }

        } else if (result.response === 2) {
          // Usually Exit Button

          if (fn_3 != undefined) {
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

  /*
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
  */

  // EDIT VERSION ONLY FOR MANGAWORLD
  saveCookie() {
    this.normal = ''
    this.hard = ''

    session.defaultSession.cookies.get({ url: site[0] })
      .then((cookies) => {
        if (cookies != []) {
          this.normal = cookies.map(
            (value) => {
              value.url = site[0]
              return value
            }
          )
        }
      }).catch((error) => {
        console.log(error)
      })

    session.defaultSession.cookies.get({ url: site[1] })
      .then((cookies) => {
        if (cookies != []) {
          this.hard = cookies.map(
            (value) => {
              value.url = site[1]
              return value
            }
          )

          fs.writeFileSync(path.join(__dirname, '/src/cookies/cookies.json'), JSON.stringify(this.normal.concat(this.hard), null, 2));
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

app.whenReady().then(async () => {
  await get_link()
  main_page = new createWindow('master')
  browser_page = new createWindow('slave')
  main_page
  browser_page


  browser_page.load_coockie()
  browser_page.goto(site[site_mode] + 'bookmarks/' + user_id)


  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await get_link()
      main_page = new createWindow('master')
      browser_page = new createWindow('slave')
      main_page
      browser_page


      browser_page.load_coockie()
      browser_page.goto(site[site_mode] + 'bookmarks/' + user_id)

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
