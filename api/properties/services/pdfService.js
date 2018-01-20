var puppeteer = require('puppeteer');
var browser;
module.exports = {
    getCookie : function(hostname,name,value) {
        return   {
            'name': name, /* required property */
            'value': value.toString(), /* required property */
            'domain': hostname,
            'path': '/', /* required property */
            'httponly': false,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
        }
    },

    getBrowser : function(callback) {
        if (browser) {
            return callback(browser);
        }
        puppeteer.launch({
            headless: true,
            args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        }).then((newBrowser) => {
            browser = newBrowser;
            callback(browser);
            browser.on("disconnected", () => {
                browser = null;
                console.log('disconnected');
            })
        });
    },
    getPdf : function(url, cookies, callback) {

        this.getBrowser(browser => {
            browser.newPage().then(page => {
                page.setUserAgent("PhantomJS").then(()=>
                    page.setCookie(...cookies)
                        .then(()=>page.emulateMedia('print')
                            .then(()=>page.goto(url,{waitUntil: 'networkidle0'})
                                // .then(()=>page.addStyleTag({content : "@media print {.table {border-collapse: separate !important}} .maingrid.wrapper.panel .tfoot td {border-top:inherit}"})
                                    .then(()=> page.waitForFunction('window.renderable == true')
                                        .then(()=>page.pdf({format: "A4", printBackground: true})
                                            .then((pdf) => {
                                                callback(pdf)
                                                page.close();
                                            })
                                        )
                                    )
                                // )
                            )
                        )
                )

            });
        })
    }
}
