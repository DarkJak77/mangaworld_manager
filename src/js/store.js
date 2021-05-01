class Store {

  constructor() {
    // contiene le informazioni preliminari per poter creare le cartelle e contiene il link al manga 
    // senza la parte finale nomefile.estensione
    this.info = {
      title: '',
      volume: '',
      chapter: '',
      pre_link: ''
    }

    //contiene le varie finestre
    this.browser = {
      'main':'',
      'volume': '',
      'chapter': ''
    }

    // contiene il file json una volta caricato
    this.json = {
      // contiene il file raw del json, quando si salva il json però per un breve istante contiene la 
      // versione stringify, non è il massimo ma serve a risparmiare variabili
      'raw': '', 
      'data': ''
    }
    
    // contiene la lista dei link dei capitoli da elaborare
    this.to_do = []

    // 0 = normale
    // 1 = manga nei preferiti
    // 2 = cerca nuovi capitoli
    this.check = 0

    // viene usanta quando si cercano nuovi capitoli dei manga preferiti, contiene il numero 
    // delle key del file json 
    this.cycle = 0

    // contiene il link che verrà usato per salvare il manga nei preferiti
    this.tmp = ''

    // usato per la barra ( SPERIMENTALE )
    this.tmp_value = {
      to_do : 1,
      do: 1
    }

  }

  // serve per ripristinare i valori
  initialize() {
    this.info = {
      title: '',
      volume: '',
      chapter: '',
      pre_link: ''
    }

    this.to_do.length = []

    this.check = 0

    this.cycle = 0

    this.tmp = ''

    this.tmp_value = {
      to_do : 1,
      do: 1
    }
  }
}

module.exports = Store