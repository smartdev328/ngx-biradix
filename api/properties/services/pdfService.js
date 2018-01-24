var puppeteer = require('puppeteer');
var browser;
var settings = require("../../../config/settings")
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

    getBrowser : function(url, callback) {
        // if (browser) {
        //     return callback(browser);
        // }

        if (url.indexOf("localhost") > -1) {
            puppeteer.launch({
                headless: true,
                args: [/*'--disable-gpu'*/, '--no-sandbox', '--disable-setuid-sandbox'],
                slowMo: 0
            }).then((newBrowser) => {
                browser = newBrowser;
                callback(null,browser);
                // browser.on("disconnected", () => {
                //     browser = null;
                //     console.log('disconnected');
                // })
            }).catch(err=> {callback(err,null);})
        }
        else {
            puppeteer.connect({
                browserWSEndpoint: 'wss://chrome.browserless.io?token=' + settings.BROWSERLESS_IO_KEY
            }).then((newBrowser) => {
                browser = newBrowser;
                callback(null,browser);
                // browser.on("disconnected", () => {
                //     browser = null;
                //     console.log('disconnected');
                // })
            }).catch(err=> {callback(err,null);})
        }

    },
    getPdf : function(url, cookies, callback) {
        var timer = new Date().getTime();
        this.getBrowser(url,(err,browser) => {

            if (err) {
                return callback(err,null);
            }
            // console.log("Got Browser: " + (new Date().getTime() - timer) + "ms");
            // timer = new Date().getTime();
            browser.newPage().then(page => {
                page.setUserAgent("PhantomJS")
                    .then(()=>page.setCookie(...cookies)).catch(err=> {callback(err,null);})
                    .then(()=>page.emulateMedia('print')).catch(err=> {callback(err,null);})
                    .then(()=> {
                        page.setRequestInterception(true)

                        page.on('request', interceptedRequest => {

                            if (
                                interceptedRequest.url().indexOf("www.google-analytics") > -1
                                ||
                                interceptedRequest.url().indexOf("images/squares.gif") > -1
                            ) {
                                interceptedRequest.abort();
                            }
                            else {
                                // console.log(interceptedRequest.url());
                                interceptedRequest.continue();
                            }
                        });
                    }).catch(err=> {callback(err,null);})
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
                                                callback(null,pdf)
                                                browser.close();
                                            }).catch(err=> {callback(err,null);})
                                    }).catch(err=> {callback(err,null);})
                            }).catch(err=> {callback(err,null);})
                    }).catch(err=> {callback(err,null);})
            }).catch(err=> {callback(err,null);})
        })
    }
}
