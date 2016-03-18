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
            .state('login', {
                url: "/login?r",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/login/login.html?bust=" + version,
                        controller : "loginController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'login/loginController')}}
            })
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
            .state('password', {
                url: "/password",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/password.html?bust=" + version,
                        controller : "passwordOffController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'passwordOff/passwordOffController')}}
            })
            .state('password_sent', {
                url: "/password/sent",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/sent.html?bust=" + version,
                    }
                }
            })
            .state('password_invalid', {
                url: "/password/invalid",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/invalid.html?bust=" + version,
                    }
                }
            })
            .state('password_reset', {
                url: "/password/reset/:token",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/reset.html?bust=" + version,
                        controller : "resetController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'passwordOff/resetController')}}
            })
            .state('dashboard', {
                url: "/dashboard",
                views: {
                    "loggedInView": {
                        templateUrl: "app/dashboard/dashboard.html?bust=" + version ,
                        controller : "dashboardController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'dashboard/dashboardController')}}
            })
            .state('manageUsers', {
                url: "/manageusers",
                views: {
                    "loggedInView": {
                        templateUrl: "app/manageUsers/manageUsers.html?bust=" + version ,
                        controller : "manageUsersController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'manageUsers/manageUsersController')}}
            })
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
            .state('updateProfile', {
                url: "/updateProfile?password&notifications&settings",
                views: {
                    "loggedInView": {
                        templateUrl: "app/updateprofile/updateProfile.html?bust=" + version ,
                        controller : "updateProfileController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'updateprofile/updateProfileController')}}
            })
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
            .state('uploadSurveys', {
                url: "/uploadSurveys",
                views: {
                    "loggedInView": {
                        templateUrl: "app/uploadSurveys/uploadSurveys.html?bust=" + version ,
                        controller : "uploadSurveysController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'uploadSurveys/uploadSurveysController')}}
            })
    });

    app.filter("sanitize", ['$sce', function ($sce) {
        return function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        }
    }]);

    app.run([
        '$rootScope', '$modalStack',
        function($rootScope, $modalStack) {

            $rootScope.$on('$stateChangeStart', function() {
                //Cancel all popups
                $modalStack.dismissAll('cancel');
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