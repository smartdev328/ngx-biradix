"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyPmsMissmatchController", ["$scope", "$uibModalInstance", "$dialog", "originalSurvey", "pms", function ($scope, $uibModalInstance, $dialog, originalSurvey, pms) {
        ga("set", "title", "/PmsMissmatch");
        ga("set", "page", "/PmsMissmatch");
        ga("send", "pageview");

        $scope.pms = pms;
        $scope.originalSurvey = originalSurvey;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };

        $scope.showAllPmsFp = function() {
            $scope.allShownPmsFp = !$scope.allShownPmsFp;
        }

    }]);
});