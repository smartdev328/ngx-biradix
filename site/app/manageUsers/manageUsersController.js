'use strict';
define([
    'app',
], function (app) {

    app.controller('manageUsersController', ['$scope','$rootScope','$location', function ($scope,$rootScope,$location) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";

        $rootScope.sideMenu = [];
        $rootScope.sideMenu.push({ label: "Manage Users", href: '#/manageusers', active: true });
        $rootScope.sideMenu.push({ label: "Preferences", href: '#/preferences', active: false });

    }]);
});