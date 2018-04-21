var puppeteer = require('puppeteer');
var browser;
var settings = require("../../../config/settings")

module.exports = {
    getCookie : function(hostname,name,value) {
        return   {
            'name': name, /* required property */
            'value': (value || "").toString(), /* required property */
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
    getPdf : function(transaction_id, url, cookies, callback) {
        var timer = new Date().getTime();
        this.getBrowser(url,(err,browser) => {

            if (err) {
                return callback(err,null);
            }
            let log = {"event": "Pdf get remote browser", "transaction_id": transaction_id, "pdf_get_browser_time_ms": (new Date().getTime() - timer)};
            console.log(JSON.stringify(log));
            timer = new Date().getTime();
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
                        let log = {"event": "Pdf set cookies/ua/print", "transaction_id": transaction_id, "pdf_settings_time_ms": (new Date().getTime() - timer)};
                        console.log(JSON.stringify(log));

                        timer = new Date().getTime();
                        page.goto(url, {timeout: 60000 * 5})
                            .then(()=> {
                                let log = {"event": "Pdf load page html", "transaction_id": transaction_id, "pdf_load_page_time_ms": (new Date().getTime() - timer)};
                                console.log(JSON.stringify(log));
                                timer = new Date().getTime();
                                page.waitForFunction("window.renderable == true", {timeout: 60000 * 5})
                                    .then(()=> {
                                        let log = {"event": "Pdf render with angular/highcharts", "transaction_id": transaction_id, "pdf_angular_time_ms": (new Date().getTime() - timer)};
                                        console.log(JSON.stringify(log));

                                        timer = new Date().getTime();

                                        page.pdf({format: "A4", printBackground: true})
                                            .then((pdf) => {
                                                let log = {"event": "Pdf print/download", "transaction_id": transaction_id, "pdf_file_ready_time_ms": (new Date().getTime() - timer)};
                                                console.log(JSON.stringify(log));

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
