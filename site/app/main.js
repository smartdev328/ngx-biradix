requirejs.config({
    urlArgs: "bust=" + version,
    map: {
        '*': {
            'css': '/libs/requirejs/css-min.js'
        }
    },
    paths: {
        'async': '/libs/requirejs/async',
        'highcharts': '/bower_components/highcharts-release/highcharts',
        'async2': local ? '/bower_components/async/dist/async.min' : '//cdnjs.cloudflare.com/ajax/libs/async/1.5.0/async.min',
    }
});

global_error = function(err,context) {
    if (err) {
        //Reload
        console.error(err.stack);
        var s= JSON.stringify(err.stack);

        if (location.href.indexOf('localhost') == -1) {
            $.post("/error", {error: err.stack, context: context}).done(function (data) {
                if (
                    !phantom //dont redirect on phantom errors
                    && s.indexOf("Unable to get property 'focus'") == -1 //strange error that happens when closing modal, dont redirect
                ) {
                    location.href = "/error.html";
                }
            });
        }
    }
}

requirejs.onError = function (err) {
    global_error(err,null);
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


