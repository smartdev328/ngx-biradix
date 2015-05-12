'use strict';
define([
    'app',
], function (app) {

    app.controller('bobController', ['$scope','$rootScope','$location', function ($scope,$rootScope,$location) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

    }]);
});