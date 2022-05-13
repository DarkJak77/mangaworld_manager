const { ipcRenderer } = require('electron');

let dict = [


]



// when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('toMain', 'load_slave')

})


ipcRenderer.on("myRenderChannel", (event, ...args) => {
  if (args[0] == 'load') {

  } else if (args[0].includes('check_fav_*')) {
    let fav = document.getElementsByClassName(args[0].split('_*')[1])[0]
    ipcRenderer.send('toMain', JSON.stringify(fav))

  /*
      < div class="entry vertical bookmark" >
        <a href="https://www.mangaworld.in/manga/1983/1-3-sanbun-no-ichi/" class="thumb position-relative" title="1/3 Sanbun no Ichi">
          <img src="https://cdn.mangaworld.in/mangas/5fa8c1e642e2937121a22410.jpg?1652478161266" alt="1/3 Sanbun no Ichi" loading="lazy">
            <div class="latest-chapter" style="background-color:#28a745;">
              <span class="font-weight-bold d-inline">Ultimo letto:
              </span> Capitolo 40
              </div>
              <div class="creation-date" style="background-color:#28a745;">
                <span class="font-weight-bold d-none d-sm-inline">Aggiunto il:
                </span> 23 Agosto 2021
                </div>
                <div class="selectbookmarkcontent d-flex justify-content-center align-items-center" style="background-color:#28a745;">
                  <div class="form-check d-flex justify-content-center align-items-center">
                    <input type="checkbox" class="form-check-input bookmark-checkbox" id="bookmark-checkbox-0" autocomplete="off" data-dashlane-rid="800b7d2ed9d3fe11" data-form-type="other">
                    </div>
                    </div>
                    </a>
                    <p title="1/3 Sanbun no Ichi" class="name m-0 text-center">
                      <a class="manga-title" href="https://www.mangaworld.in/manga/1983/1-3-sanbun-no-ichi/">1/3 Sanbun no Ichi</a>
                      </p>
                      </div >

    */


  }

})

