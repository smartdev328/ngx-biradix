'use strict';
define([
    'app',
], function (app) {

    app.controller('preferencesController', ['$scope','$rootScope','$location', function ($scope,$rootScope,$location) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";

        $rootScope.sideMenu = [];
        $rootScope.sideMenu.push({ label: "Manage Users", href: '#/manageusers', active: false });
        $rootScope.sideMenu.push({ label: "Preferences", href: '#/preferences', active: true });

    }]);
});