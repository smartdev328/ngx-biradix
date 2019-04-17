var phantom = navigator.userAgent.indexOf("PhantomJS") > -1
requirejs.config({
    urlArgs: "bust=" + version,
    waitSeconds: 30,
    paths: {
        "async": "/bower_components/async/dist/async.min",
    },
});

window.addEventListener('load', function() {
    Raygun.init(raygun_key);
    Raygun.setVersion(version);

    Raygun.onBeforeSend(function(payload) {
        if (FS && FS.getCurrentSessionURL) {
            payload.Details.UserCustomData.fullStoryUrl = (FS.getCurrentSessionURL() || "").replace("%3A", ":");
        }
        return payload;
    });


    global_error = function(err,context) {
        if (err) {
            Raygun.send(err);
            console.error(err.stack);
        }
    }
});

requirejs.onError = function(err) {
    global_error(err, {location: location.href});
};

require([
    "app",
], function (app) {
    angular.bootstrap(document, [app.name]);
});
