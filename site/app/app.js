'use strict';

function resolve($q, ctrl) {
    //$('.routeLoading').show();
    //$('.routeContent').hide();
    var deferred = $q.defer();
    require([
        ctrl
    ], function () {
        deferred.resolve();
        //$('.routeLoading').hide();
        //$('.routeContent').show();
    });
    return deferred.promise;
}

function AsyncRoute (url, path, controller,view, outlet) {

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
    };

    if (controller) {
        r.resolve = {
            get: function ($q) {
                return resolve($q, path + '/' + controller)
            }
        }
    }


    return r;
}

define([
    '../components/ngProgress/module',
    'css!global'
], function () {
    var app = angular.module('Team', [
        , 'ui.router'
        , 'ui.bootstrap'
        , 'toastr'
        , 'ngCookies'
        , 'ngProgress'
        , 'ngSanitize'
    ]);

    app.config(function ($controllerProvider, $provide, $compileProvider, $filterProvider, $stateProvider, $urlRouterProvider, toastrConfig) {
        app.controller = $controllerProvider.register;
        app.factory = $provide.factory;
        app.directive = $compileProvider.directive;
        app.filter = $filterProvider.register;

        angular.extend(toastrConfig, {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right',
            allowHtml: true,
            progressBar : true,
            tapToDismiss: true,
            extendedTimeOut: 5000
        });

        $urlRouterProvider.otherwise("/dashboard");

        $stateProvider
            .state('login', AsyncRoute("/login?r","login","loginController","login.html","loggedOutView"))
            .state('contact', {
                url: "/contact",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/contactOff/contact.html?bust=" + version,
                        controller : "contactOffController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'contactOff/contactOffController')}}
            })
            .state('contact_thank_you', {
                url: "/contact/thankyou",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/contactOff/thankyou.html?bust=" + version,
                    }
                }
            })
            .state('password', AsyncRoute("/password","passwordOff","passwordOffController","password.html","loggedOutView"))
            .state('password_sent', AsyncRoute("/password/sent","passwordOff",null,"sent.html","loggedOutView"))
            .state('password_invalid', AsyncRoute("/password/invalid","passwordOff",null,"invalid.html","loggedOutView"))
            .state('password_reset', AsyncRoute("/password/reset/:token","passwordOff","resetController","reset.html","loggedOutView"))

            .state('dashboard?id', AsyncRoute("/dashboard","dashboard","dashboardController","dashboard.html","loggedInView"))
            .state('manageUsers', AsyncRoute("/manageusers","manageUsers","manageUsersController","manageUsers.html","loggedInView"))

            .state('properties', {
                url: "/properties",
                views: {
                    "loggedInView": {
                        templateUrl: "app/properties/properties.html?bust=" + version ,
                        controller : "propertiesController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'properties/propertiesController')}}
            })
            .state('history', {
                url: "/history",
                views: {
                    "loggedInView": {
                        templateUrl: "app/history/history.html?bust=" + version ,
                        controller : "historyController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'history/historyController')}}
            })
            .state('preferences', {
                url: "/preferences",
                views: {
                    "loggedInView": {
                        templateUrl: "app/preferences/preferences.html?bust=" + version ,
                        controller : "preferencesController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'preferences/preferencesController')}}
            })
            .state('profile', {
                url: "/profile/:id",
                views: {
                    "loggedInView": {
                        templateUrl: "app/profile/profile.html?bust=" + version,
                        controller : "profileController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'profile/profileController')}}
            })
            .state('full', {
                url: "/full/:id",
                views: {
                    "loggedInView": {
                        templateUrl: "app/full/full.html?bust=" + version,
                        controller : "fullController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'full/fullController')}}
            })
            .state('reporting', {
                url: "/reporting",
                views: {
                    "loggedInView": {
                        templateUrl: "app/reporting/reporting.html?bust=" + version ,
                        controller : "reportingController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'reporting/reportingController')}}
            })
            .state('updateProfile', AsyncRoute("/updateProfile?password&notifications&settings","updateprofile","updateProfileController","updateProfile.html","loggedInView"))
            .state('contactus', {
                url: "/contactus",
                views: {
                    "loggedInView": {
                        templateUrl: "app/contact/contact.html?bust=" + version ,
                        controller : "contactController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'contact/contactController')}}
            })
            .state('uploadSurveys', AsyncRoute("/uploadSurveys","uploadSurveys","uploadSurveysController","uploadSurveys.html","loggedInView"))
            .state('amenities', AsyncRoute("/amenities","amenities","amenitiesController","amenities.html","loggedInView"))
    });

    app.filter("sanitize2", ['$sanitize', function ($sanitize) {
        return function (htmlCode) {
            return $sanitize(htmlCode);
        }
    }]);

    app.filter("sanitize", ['$sce', function ($sce) {
        return function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        }
    }]);

    app.run([
        '$rootScope', '$uibModalStack',
        function($rootScope, $uibModalStack) {

            $rootScope.$on('$stateChangeStart', function() {
                //Cancel all popups
                $uibModalStack.dismissAll('cancel');
            });
        }
    ]);

    app.factory('$exceptionHandler', function () {
        return function errorCatcherHandler(exception, cause) {
            global_error(exception,null);
        };
    });

    return app;
});