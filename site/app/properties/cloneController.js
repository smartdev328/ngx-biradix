"use strict";
define([
    "app",
], function(app) {
    app.controller("cloneController",
    ["$scope", "$uibModalInstance", "property", "$propertyService", "ngProgress", "toastr",
    function($scope, $uibModalInstance, property, $propertyService, ngProgress, toastr) {
        ga("set", "title", "/cloneProperty");
        ga("set", "page", "/cloneProperty");
        ga("send", "pageview");

        $scope.property = property;
        $scope.comps = false;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };

        $scope.save = function() {
            $("button.contact-submit").prop("disabled", true);
            ngProgress.start();

            $propertyService.clone(property._id, $scope.comps).then(function(response) {
                $("button.contact-submit").prop("disabled", false);
                if (response.data.errors) {
                    toastr.error(_.pluck(response.data.errors, "msg").join("<br>"));
                } else {
                    $uibModalInstance.close();
                }

                ngProgress.reset();
            },
            function() {
                $("button.contact-submit").prop("disabled", false);
                toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this screen. <br> Very sorry for the trouble. <a href='javascript:location.reload();'>click here</a> to refresh");
                ngProgress.reset();
            });
        };
    }]);
});
