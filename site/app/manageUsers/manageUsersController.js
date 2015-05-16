'use strict';
define([
    'app',
], function (app) {

    app.controller('manageUsersController', ['$scope','$rootScope','$location', function ($scope,$rootScope,$location) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";

    }]);
});