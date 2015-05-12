'use strict';
define([
    'app',

], function (app) {

    app.controller('passwordOffController', ['$scope','$rootScope','$location','toastr','$window', function ($scope,$rootScope,$location,toastr,$window) {

        if ($rootScope.loggedIn) {
            $location.path('/dashboard')
        }

    }]);
});