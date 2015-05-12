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
            positionClass: 'toast-top-full-width'
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
            .state('bob', {
                url: "/bob",
                views: {
                    "loggedInView": {
                        templateUrl: "app/bob/bob.html" ,
                        controller : "bobController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'bob/bobController')}}
            })
    });

    return app;
});