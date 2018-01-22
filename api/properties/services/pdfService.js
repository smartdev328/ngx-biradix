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
        puppeteer.connect({
            browserWSEndpoint: 'wss://chrome.browserless.io'
            // headless: true,
            // args: [/*'--disable-gpu'*/, '--no-sandbox', '--disable-setuid-sandbox'],
            // slowMo: 0
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
        var timer = new Date().getTime();
        this.getBrowser(browser => {
            // console.log("Got Browser: " + (new Date().getTime() - timer) + "ms");
            // timer = new Date().getTime();
            browser.newPage().then(page => {
                page.setUserAgent("PhantomJS")
                    .then(()=>page.setCookie(...cookies)
                        .then(()=>page.emulateMedia('print')
                            .then(()=> {
                                console.log("PDF Variables: " + (new Date().getTime() - timer) + "ms");
                                    timer = new Date().getTime();
                                page.goto(url)
                                        .then(()=> {
                                            console.log("PDF Goto: " + (new Date().getTime() - timer) + "ms");
                                            timer = new Date().getTime();
                                            page.waitForFunction('window.renderable == true')
                                                    .then(()=> {
                                                        console.log("PDF window.renderable: " + (new Date().getTime() - timer) + "ms");
                                                        timer = new Date().getTime();

                                                        page.pdf({format: "A4", printBackground: true})
                                                                .then((pdf) => {
                                                                    console.log("PDF Print: " + (new Date().getTime() - timer) + "ms");
                                                                    callback(pdf)
                                                                    page.close();
                                                                })
                                                        }
                                                    )
                                            }
                                        )
                                    }
                                )
                            )
                        )

            });
        })
    }
}
