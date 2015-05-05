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

], function () {
    var app = angular.module('Team', [
        , 'ui.router'
        , 'ui.bootstrap'
        , 'toastr'
        , 'ngCookies'
    ]);

    app.config(function ($controllerProvider, $provide, $compileProvider, $filterProvider, $stateProvider, $urlRouterProvider) {
        app.controller = $controllerProvider.register;
        app.factory = $provide.factory;
        app.directive = $compileProvider.directive;
        app.filter = $filterProvider.register;

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
    });

    return app;
});