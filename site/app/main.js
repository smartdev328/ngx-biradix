requirejs.config({
    urlArgs: "bust=" + version,
    map: {
        '*': {
            'css': '/libs/requirejs/css-min.js'
        }
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


