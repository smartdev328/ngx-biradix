requirejs.config({
    urlArgs: "bust=" + version,
    map: {
        '*': {
            'css': '/libs/requirejs/css-min.js'
        }
    },
    paths: {
        'async': '/libs/requirejs/async'
    }
});

require([
    'app'
], function (app) {

    require([
        'rootController',
    ], function () {

        angular.bootstrap(document, [app.name]);

    });
});


