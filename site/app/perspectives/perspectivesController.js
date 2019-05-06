"use strict";
define([
    "app",
], function(app) {
     app.controller("perspectivesController", ["$scope", "$rootScope", "$perspectivesService", function($scope, $rootScope, $perspectivesService) {
        window.setTimeout(function() {
            window.document.title = "My Account - Perspectives | BI:Radix";
            }, 1500);

        $rootScope.sideNav = "Perspectives";
        $rootScope.sideMenu = true;

        $scope.selectedPerspective = null;
        $scope.selectdProperty = null;
        $scope.loading = true;

         $perspectivesService.scopeFunctions($scope);

         var me = $rootScope.$watch("me", function(x) {
             if ($rootScope.me) {
                 $scope.loading = false;
                 me();
             }
         });
     }]);
});
