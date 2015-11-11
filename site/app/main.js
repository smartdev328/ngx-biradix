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
    }
});

requirejs.onError = function (err) {
    if (err) {
        //Reload
        NREUM.noticeError(err);
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


