module.exports = {
    getDefaultOptions : function() {
        var options = {
            pool        : 1,           // Change the pool size. Defaults to 1
            timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
            format      : 'pdf',      // The default output format. Defaults to png
            quality     : 100,         // The default image quality. Defaults to 100. Only relevant for jpeg format.
            width       : 1280,        // Changes the width size. Defaults to 1280
            height      : 960,         // Changes the height size. Defaults to 960
            paperFormat : 'A4',        // Defaults to A4. Also supported: 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'.
            orientation : 'portrait',  // Defaults to portrait. 'landscape' is also valid
            margin      : '10px',       // Defaults to 0cm. Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'.
            userAgent   : '',          // No default.
            headers     : {}, // Additional headers to send with each upstream HTTP request
            paperSize   : null,        // Defaults to the paper format, orientation, and margin.
            crop        : false,       // Defaults to false. Set to true or {top:5, left:5} to add margin
            printMedia  : true,       // Defaults to false. Force the use of a print stylesheet.
            maxErrors   : 3,           // Number errors phantom process is allowed to throw before killing it. Defaults to 3.
            expects     : true, // No default. Do not render until window.renderable is set to 'something'
            retries     : 1,           // How many times to try a render before giving up. Defaults to 1.
            phantomFlags: [], // Defaults to []. Command line flags passed to phantomjs
            maxRenders  : 20,          // How many renders can a phantom process make before being restarted. Defaults to 20
        };

        return options;
    },

    getCookie : function(hostname,name,value) {
        return   {
            'name': name, /* required property */
            'value': value, /* required property */
            'domain': hostname,
            'path': '/', /* required property */
            'httponly': false,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
        }
    }
}
