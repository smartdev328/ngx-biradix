"use strict";
define([
    "app",
], function(app) {
     app.controller("perspectivesController", ["$scope", "$rootScope", function($scope, $rootScope) {
            window.setTimeout(function() {
                window.document.title = "My Account - Perspectives | BI:Radix";
                }, 1500);

            $rootScope.sideNav = "Perspectives";
            $rootScope.sideMenu = true;
        }]);
});
