'use strict';
define([
    'app',
    '../../components/dialog/module'
], function (app) {

    app.controller('historyController', ['$scope','$rootScope','$location','ngProgress','$dialog', function ($scope,$rootScope,$location,ngProgress,$dialog) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";

        $rootScope.sideMenu = [];
        if ($rootScope.me.permissions.indexOf('Users') > -1) {
            $rootScope.sideMenu.push({label: "Manage Users", href: '#/manageusers', active: false});
        }

        if ($rootScope.me.permissions.indexOf('Properties') > -1) {
            $rootScope.sideMenu.push({label: "Manage Properties", href: '#/properties', active: false});
        }

        if ($rootScope.me.permissions.indexOf('History') > -1) {
            $rootScope.sideMenu.push({label: "Activity History", href: '#/history', active: true});
        }

    }]);
});