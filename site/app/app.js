'use strict';

function resolve($q, ctrl) {
    var deferred = $q.defer();
    require([
        ctrl
    ], function () {
        deferred.resolve();
    });
    return deferred.promise;
}

define([
    '../components/ngProgress/module'
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
            positionClass: 'toast-top-full-width',
            allowHtml: true
        });

        $urlRouterProvider.otherwise("/dashboard");

        $stateProvider
            .state('login', {
                url: "/login",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/login/login.html",
                        controller : "loginController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'login/loginController')}}
            })
            .state('contact', {
                url: "/contact",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/contactOff/contact.html",
                        controller : "contactOffController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'contactOff/contactOffController')}}
            })
            .state('contact_thank_you', {
                url: "/contact/thankyou",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/contactOff/thankyou.html",
                    }
                }
            })
            .state('password', {
                url: "/password",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/password.html",
                        controller : "passwordOffController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'passwordOff/passwordOffController')}}
            })
            .state('password_sent', {
                url: "/password/sent",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/sent.html",
                    }
                }
            })
            .state('password_invalid', {
                url: "/password/invalid",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/invalid.html",
                    }
                }
            })
            .state('password_reset', {
                url: "/password/reset/:token",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/passwordOff/reset.html",
                        controller : "resetController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'passwordOff/resetController')}}
            })
            .state('dashboard', {
                url: "/dashboard",
                views: {
                    "loggedInView": {
                        templateUrl: "app/dashboard/dashboard.html" ,
                        controller : "dashboardController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'dashboard/dashboardController')}}
            })
            .state('manageUsers', {
                url: "/manageusers",
                views: {
                    "loggedInView": {
                        templateUrl: "app/manageUsers/manageUsers.html" ,
                        controller : "manageUsersController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'manageUsers/manageUsersController')}}
            })
            .state('profile', {
                url: "/profile/:id",
                views: {
                    "loggedInView": {
                        templateUrl: "app/profile/profile.html",
                        controller : "profileController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'profile/profileController')}}
            })
    });

    return app;
});