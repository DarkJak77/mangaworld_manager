class Store {

  constructor() {
    this.info = {
      title: '',
      volume: '',
      chapter: '',
      pre_link: ''
    }

    this.browser = {
      'main':'',
      'volume': '',
      'chapter': ''
    }

    this.json = {
      'raw': '',
      'data': ''
    }

    this.to_do = []

    this.check = 0

    this.cycle = 0

    this.tmp = ''

  }

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
  }
}

module.exports = Store