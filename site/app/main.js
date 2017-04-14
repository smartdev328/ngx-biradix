requirejs.config({
    urlArgs: "bust=" + version,
    waitSeconds: 30,
    paths: {
        'async': '/bower_components/async/dist/async.min',
    }
});

global_error = function(err,context) {
    if (err) {
        //Reload
        console.error(err.stack);
        var s= JSON.stringify(err.stack);

        //if (location.href.indexOf('localhost') == -1) {
            $.post("/error", {error: err.stack, context: context}).done(function (data) {
                if (
                    !phantom //dont redirect on phantom errors
                    && s.indexOf("Unable to get property 'focus'") == -1 //strange error that happens when closing modal, dont redirect
                ) {
                    //location.href = "/error.html";
                }
            });
        //}
    }
}

requirejs.onError = function (err) {
    global_error(err,{location: location.href});
};

require([
    'app'
], function (app) {
    angular.bootstrap(document, [app.name]);
});


