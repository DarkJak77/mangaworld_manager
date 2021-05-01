const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // in questo modo si espandono tutti i volumi e si mettono in ordine crescente
  let button = document.getElementsByClassName('btn btn-dark px-2 py-1')
  button[0].click()
  button[1].click()

  let chapter = document.getElementsByClassName('chapter')
  let title = document.getElementsByClassName('name bigger')[0].textContent

  // serve per conosce il numero dell'ultimo capitolo conosciuto ed evitare di elaborare i vecchi capitoli
  // ovviamente bisogna essere in modalità check_new
  let cycle = ipcRenderer.sendSync('toMain', 'check_manga_*' + title + '_*' + chapter.length)

  for (let i = cycle; i < chapter.length; i++) {
    ipcRenderer.invoke('add_list', chapter[i].children[0].href)
  }
  
  ipcRenderer.send('toMain', 'start_*' + title)

})
