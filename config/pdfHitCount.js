var settings = require('./settings')
var cluster = require('cluster');


function check() {
    console.log("WorkerId:",cluster.worker.id, "Pdf Count:", settings.PDF_HIT_COUNT);

    if (settings.PDF_HIT_COUNT > settings.PDF_HIT_RESTART) {
        settings.PDF_HIT_COUNT = 0;
        process.exit(0);
    }

    setTimeout(function () {
        check();
    }, 30000);
}

if (!cluster.isMaster) {
    setTimeout(function () {
        check();
    }, 30000);
}