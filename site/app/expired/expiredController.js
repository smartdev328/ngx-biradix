'use strict';
define([
    'app',
], function (app) {

    app.controller('expiredController', ['$scope','$stateParams', function ($scope,$stateParams) {

        window.document.title = "Link Expired | BI:Radix";

        $scope.name=$stateParams.name;


    }]);
});