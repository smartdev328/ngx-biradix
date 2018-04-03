requirejs.config({
    urlArgs: "bust=" + version,
    waitSeconds: 30,
    paths: {
        "async": "/bower_components/async/dist/async.min",
    },
});

Raygun.init(raygun_key);
Raygun.setVersion(version);

global_error = function(err,context) {
    if (err) {
        Raygun.send(err);
        console.error(err.stack);
    }
}

requirejs.onError = function(err) {
    global_error(err, {location: location.href});
};

require([
    "app",
], function (app) {
    angular.bootstrap(document, [app.name]);
});
