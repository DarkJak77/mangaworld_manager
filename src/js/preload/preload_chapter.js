const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  let title = document.getElementsByClassName('section-left col-12 col-md-8 p-0 pr-1')[0].innerText.replace("Ritorna a ",'')
  let volume_tovalue = document.getElementsByClassName('volume custom-select')
  let volume = ''

  let chapter_tovalue = document.getElementsByClassName('chapter custom-select')[0]
  let chapter = ''

  for (let i = 0; i < chapter_tovalue.length; i++) {
    const e = chapter_tovalue[i];
    if(e.selected == true){
      chapter = e.text
    }
  }

  if (volume_tovalue.length != 0){
    volume_tovalue = document.getElementsByClassName('volume custom-select')[0]
    for (let i = 0; i < volume_tovalue.length; i++) {
      const e = volume_tovalue[i];
      if(e.selected == true){
        volume = e.text
      }
    }
  } else {
    volume = 'none'
  }

  const link = document.getElementsByClassName('page-image img-fluid')

  const end_link = link[0].src.split('/')[link[0].src.split('/').length -1]
  const pre_link = link[0].src.replace(end_link,'')

  ipcRenderer.send('toMain', 'master_*'+ title + '_*' + volume + '_*' + chapter + '_*' + pre_link)

  for (page = 0; page < link.length; page++) {
    let end = link[page].src.split('/')[link[page].src.split('/').length -1]
    ipcRenderer.send('toMain', 'dl_*' + end);
  }

  ipcRenderer.send('toMain','quit')
})

