'use strict';
define([
    'app',
], function (app) {

    app.controller('dashboardController', ['$scope','$rootScope','$location', function ($scope,$rootScope,$location) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $scope.hi = "hi";


    }]);
});