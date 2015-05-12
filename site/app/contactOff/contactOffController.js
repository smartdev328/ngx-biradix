'use strict';
define([
    'app',

], function (app) {

    app.controller('contactOffController', ['$scope','$rootScope','$location','toastr','$window', function ($scope,$rootScope,$location,toastr,$window) {

        if ($rootScope.loggedIn) {
            $location.path('/dashboard')
        }

    }]);
});