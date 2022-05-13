const puppeteer = require('puppeteer');
const path = require('path')
const fs = require('fs');

class Pup {

    constructor(headless, executablePath = null, link) {
        this.headless = headless
        this.executablePath = executablePath

        this.browser = ''
        this.page = ''
        this.start(link)

    }

    async start(link) {

        if ( this.executablePath != null ) {
            this.browser = await puppeteer.launch({ headless: this.headless, executablePath: this.executablePath });

        } else {
            this.browser = await puppeteer.launch({ headless: this.headless });

        }

        this.page = await this.browser.newPage();


        await this.load_cookie()

        await this.page.goto(link);

    }

    async go_to(link) {
        await this.page.goto(link);
    }

    async save_cookie() {
        this.cookies = await this.page.cookies();
        await fs.writeFile(path.join(__dirname, '..', '..', '/src/cookies/cookies.json'), JSON.stringify(this.cookies, null, 2), () => { })


    }

    async load_cookie() {
        if (fs.existsSync(path.join(__dirname, '..', '..', '/src/cookies/cookies.json'))) {

            this.cookiesString = fs.readFileSync(path.join(__dirname, '..', '..', '/src/cookies/cookies.json'))

            this.cookies = await JSON.parse(this.cookiesString)

            this.data = this.cookies.filter((v) => v)


            for (let index = 0; index < this.data.length; index++) {
                this.page.setCookie(this.data[index])

            }


        } else {
            console.log('cookie not found')

        }

    }

    delete_cookie() {
        if (fs.existsSync(path.join(__dirname, '..', '..', '/src/cookies/cookies.json'))) {
            fs.unlinkSync(path.join(__dirname, '..', '..', '/src/cookies/cookies.json'))

        }
    }

    async check_page() {
        this.url = this.page.url()
        return this.url

    }

    async page_loaded(callbackfunction) {
        await this.page.waitForNavigation({
            waitUntil: 'networkidle2',
          });


        callbackfunction()
    }

    async destroy() {
        await this.browser.close()
    }

    // serve per ripristinare i valori
    initialize() {

    }
}

module.exports = Pup