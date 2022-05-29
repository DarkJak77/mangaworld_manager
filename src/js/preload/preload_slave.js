const { ipcRenderer } = require('electron');

/*
const DOMParser = require('dom-parser')
let element = new DOMParser().parseFromString(tmp_value, "text/xml");
*/

// contains all your favorite manga items
let dict = [


]


// when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain', 'load_slave')


})


ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {

    // this is used to obtain all the information of the favorite manga and,
    // at the end of this, send the data to the main
  } else if (String(args[0]).includes('check_fav_*')) {

    let fav = document.getElementsByClassName(args[0].split('_*')[1])

    Array.from(fav).map(

      (manga) => {

        let to_add = {}

        to_add['title'] = Array.from(manga.getElementsByTagName('p')).filter((p) => p.title != '')[0].title
        //to_add['title'] = manga.lastChild.title

        to_add['link'] = Array.from(manga.getElementsByTagName('a')).filter((a) => a.href != '')[0].href
        //to_add['link'] = manga.firstChild.href

        to_add['img'] = Array.from(manga.getElementsByTagName('img')).filter((img) => img.src != '')[0].src
        //to_add['img'] = manga.firstChild.firstChild.src

        let pre_last_read = Array.from(manga.getElementsByClassName('latest-chapter'))

        if (pre_last_read.length != 0) {
          to_add['last_read'] = pre_last_read[0].innerText.split(': ')[1]

        } else if (pre_last_read.length == 0) {
          to_add['last_read'] = 'null'

        }

        let pre_status = Array.from(manga.getElementsByTagName('div')).filter((div) => div.style != '')[0].style.backgroundColor
        //to_add['status'] = manga.firstChild.lastChild.style.backgroundColor

        if (pre_status == 'rgb(255, 193, 7)') {
          to_add['status'] = 'reading'

        } else if (pre_status == 'rgb(40, 167, 69)') {
          to_add['status'] = 'complete'

        } else if (pre_status == 'rgb(108, 117, 125)') {
          to_add['status'] = 'stop'

        } else if (pre_status == 'rgb(0, 123, 255)') {
          to_add['status'] = 'to_read'

        } else if (pre_status == 'rgb(220, 53, 69)') {
          to_add['status'] = 'drop'

        }

        to_add['last_chapter'] = ''

        dict.push(to_add)

      }

    )

    ipcRenderer.send('toMain', 'dict_*' + JSON.stringify(dict))

  }

})



ipcRenderer.on("myRenderChannel", (event, ...args) => {
  
  // this function is used to obtain the number of the last chapter read of a given manga
  if (String(args[0]).includes('check_last_chapter_*')) {


    let info_chapter = document.getElementsByClassName( args[0].split('_*')[1] )[0]
    
    let to_return = Array.from(info_chapter.getElementsByTagName('span')).filter(
      (span) => span.innerText != ''
    )[0]

    ipcRenderer.send('toMain', 'check_last_chapter_result_*' + to_return.innerText)

  } 

})
