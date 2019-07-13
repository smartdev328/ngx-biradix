"use strict";

function resolve($q, ctrl) {
    //$(".routeLoading").show();
    //$(".routeContent").hide();
    var deferred = $q.defer();
    require([
        ctrl
    ], function () {
        deferred.resolve();
        //$(".routeLoading").hide();
        //$(".routeContent").show();
    });
    return deferred.promise;
}

function AsyncRoute (url, path, controller,view, outlet, data) {

    var views = {};
    views[outlet] = {
        templateUrl: "/app/" + path +"/" + view + "?bust=" + version,
    };

    if (controller) {
        views[outlet].controller = controller;
    }

    var r =
    {
        url: url,
        views: views ,
        data: data
    };

    if (controller) {
        r.resolve = {
            get: function ($q) {
                return resolve($q, path + "/" + controller)
            }
        }
    }


    return r;
}

define([], function () {
    var app = angular.module("Biradix", [
        , "ui.router"
        , "ui.bootstrap"
        , "toastr"
        , "ngCookies"
        , "ngProgress"
        , "ngSanitize"
        , "biradix.global"
        , "AxelSoft"
        , "ui.sortable"
        , "ui.indeterminate"
    ]);

    app.config(function ($controllerProvider, $provide, $compileProvider, $filterProvider, $stateProvider, $urlRouterProvider, toastrConfig) {
        app.controller = $controllerProvider.register;
        app.factory = $provide.factory;
        app.directive = $compileProvider.directive;
        app.filter = $filterProvider.register;

        angular.extend(toastrConfig, {
            timeOut: 5000,
            closeButton: true,
            positionClass: "toast-top-right",
            allowHtml: true,
            progressBar : true,
            tapToDismiss: true,
            extendedTimeOut: 5000
        });

        $urlRouterProvider.otherwise("/login");

        $stateProvider
            .state("login", AsyncRoute("/login?r&e&t", "login", "loginController", "login.html", "loggedOutView",{}))
            .state("sso", AsyncRoute("/sso?r&n", "login", "ssoController", "sso.html", "loggedOutView",{}))
            .state("expired", AsyncRoute("/expired?name", "expired", "expiredController", "expired.html", "loggedOutView",{loggedIn: false}))
            .state("contact", AsyncRoute("/contact?e", "contactOff", "contactOffController", "contact.html", "loggedOutView",{loggedIn: false}))
            .state("contact_thank_you", AsyncRoute("/contact/thankyou?e", "contactOff","contactOffController","thankyou.html", "loggedOutView",{loggedIn: false}))
            .state("password", AsyncRoute("/password?e", "passwordOff", "passwordOffController", "password.html", "loggedOutView",{loggedIn: false}))
            .state("password_sent", AsyncRoute("/password/sent?e", "passwordOff",null,"sent.html", "loggedOutView",{loggedIn: false}))
            .state("password_invalid", AsyncRoute("/password/invalid?e", "passwordOff", "passwordOffController", "invalid.html", "loggedOutView",{loggedIn: false}))
            .state("password_reset", AsyncRoute("/password/reset/:token", "passwordOff", "resetController", "reset.html", "loggedOutView",{loggedIn: false}))

            .state("maintenance", AsyncRoute("/maintenance", "login", "loginController", "maintenance.html", "loggedOutView",{loggedIn: false}))

            .state("dashboard", AsyncRoute("/dashboard?id&s", "dashboard", "dashboardController", "dashboard.html", "loggedInView",{loggedIn: true}))
            .state("dashboard2", AsyncRoute("/dashboard2?id", "dashboard2", "dashboard2Controller", "dashboard2.html", "loggedInView",{loggedIn: true}))
            .state("manageUsers", AsyncRoute("/manageusers", "manageUsers", "manageUsersController", "manageUsers.html", "loggedInView",{loggedIn: true}))
            .state("properties", AsyncRoute("/properties", "properties", "propertiesController", "properties.html", "loggedInView",{loggedIn: true}))
            .state("history", AsyncRoute("/history?property&user&range&rows&active", "history", "historyController", "history.html", "loggedInView",{loggedIn: true}))
            .state("profile", AsyncRoute("/profile/:id", "profile", "profileController", "profile.html",phantom ? "printView" : "loggedInView",{loggedIn: true}))
            .state("updateProfile", AsyncRoute("/updateProfile?password&notifications&settings", "updateprofile", "updateProfileController", "updateProfile.html", "loggedInView",{loggedIn: true}))
            .state("uploadSurveys", AsyncRoute("/uploadSurveys", "uploadSurveys", "uploadSurveysController", "uploadSurveys.html", "loggedInView",{loggedIn: true}))
            .state("amenities", AsyncRoute("/amenities", "amenities", "amenitiesController", "amenities.html", "loggedInView",{loggedIn: true}))
            .state("approvedLists", AsyncRoute("/approvedLists", "approvedLists", "approvedListsController", "approvedLists.html", "loggedInView",{loggedIn: true}))
            .state("unapprovedLists", AsyncRoute("/unapprovedLists?type", "approvedLists", "unapprovedListsController", "unapprovedLists.html", "loggedInView",{loggedIn: true}))
            .state("reporting", AsyncRoute("/reporting?property", "reporting", "reportingController",phantom ? "reporting-phantom.html" : "reporting.html",phantom ? "printView" : "loggedInView",{loggedIn: true}))
            .state("helpcontactus", AsyncRoute("/helpcontactus", "contact", "contactController", "contact.html", "loggedInView",{loggedIn: true}))
            .state("organizations", AsyncRoute("/organizations", "organizations", "organizationsController", "organizations.html", "loggedInView",{loggedIn: true}))

            .state("metrics", AsyncRoute("/metrics", "metrics", "metricsController", "metrics.html", "loggedInView", {loggedIn: true}))
            .state("import", AsyncRoute("/import", "import", "importController", "import.html", "loggedInView", {loggedIn: true}))
            .state("perspectives", AsyncRoute("/perspectives?prId&pId", "perspectives", "perspectivesController", "perspectives.html", "loggedInView", {loggedIn: true}));
    });

    app.filter("sanitize2", ["$sanitize", function ($sanitize) {
        return function(htmlCode) {
            return $sanitize(htmlCode);
        };
    }]);

    app.filter("sanitize", ["$sce", function ($sce) {
        return function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        }
    }]);

    app.run([
        "$rootScope", "$uibModalStack",
        function($rootScope, $uibModalStack) {

            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams, options) {
                // Cancel all popups
                $uibModalStack.dismissAll("cancel");
                $rootScope.globalConfirm = "";

                if ($rootScope.loggedIn && maintenance === true && toState.url.indexOf("maintenance") == -1) {
                    $rootScope.logoff();
                    return event.preventDefault();
                }

                if (toState.data && toState.data.loggedIn === true && !$rootScope.loggedIn) {
                    var ar = location.href.split("#");
                    if (ar.length == 2) {
                        if ($rootScope.hasSessionStorage) {
                            window.sessionStorage.redirect = ar[1];
                        }
                    }

                    window.location.href = "/";
                    return event.preventDefault();
                }

                if (toState.data && toState.data.loggedIn === false && $rootScope.loggedIn) {
                    $rootScope.swaptoLoggedIn();
                    return event.preventDefault();
                }

                ga("set", "title", toState.name);
                ga("set", "page", toState.name);
                ga("send", "pageview");

                if ($rootScope.reload === true) {
                    location.reload();
                }
            });
        }
    ]);

    app.factory("$exceptionHandler", function () {
        return function errorCatcherHandler(exception, cause) {
            global_error(exception,{location: location.href});
        };
    });

    app.directive('autoFocus', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            link : function($scope, $element) {
                $element[0].focus();
            }
        }
    }]);

    return app;
});
