class Store {
    
    constructor (){
        this.info = {
            title: '',
            volume: '',
            chapter: '',
            pre_link: ''
          }

        this.browser = {
            'volume': '',
            'chapter': ''
          }

        this.json = {
                  'raw':'',
                  'data':''
                }

        this.to_do = []

        this.check = 0

        this.tmp = ''

        this.cycle = 0

        
    }
}

module.exports = Store