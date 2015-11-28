requirejs.config({
    urlArgs: "bust=" + version,
    map: {
        '*': {
            'css': '/libs/requirejs/css-min.js'
        }
    },
    paths: {
        'async': '/libs/requirejs/async',
        'highcharts': local ? '/bower_components/highcharts-release/highcharts' : '//code.highcharts.com/highcharts',
        'async2': local ? '/bower_components/async/dist/async.min' : '//cdnjs.cloudflare.com/ajax/libs/async/1.5.0/async.min',
    }
});

requirejs.onError = function (err) {
    if (err) {
        //Reload
        NREUM.noticeError(err);
        console.error(err);
        location.href="/error.html";
    }
    else {
        throw err;
    }
};

require([
    'app'
], function (app) {

    require([
        'rootController',
    ], function () {

        angular.bootstrap(document, [app.name]);

    });
});


