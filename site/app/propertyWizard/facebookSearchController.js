"use strict";
define([
    "app",
], function(app) {
    app.controller("facebookSearchController", ["$scope", "$uibModalInstance", "$dialog", "toastr", "property", "$reputationService", "ngProgress",
        function($scope, $uibModalInstance, $dialog, toastr, property, $reputationService, ngProgress) {
            ga("set", "title", "/facebookSearch");
            ga("set", "page", "/facebookSearch");
            ga("send", "pageview");

            $scope.search = {
                term: property.name,
                location: property.address + ", " + property.city + ", " + property.state.abbreviation + " " + property.zip
            };

            $scope.run = function() {
                if (!$scope.search.term.trim()) {
                    return toastr.error("Please enter property name");
                }
                if (!$scope.search.location.trim()) {
                    return toastr.error("Please enter location");
                }

                ngProgress.start();
                $("#search_btn").prop("disabled", true);

                $reputationService.searchFacebook($scope.search.term, $scope.search.location, 5).then(
                    function(response) {
                        ngProgress.complete();
                        $("#search_btn").prop("disabled", false);
                        if (response.data == null) {
                            toastr.error("Unable to retrieve data. Please contact the administrator.");
                            return;
                        }

                        $scope.results = response.data;
                    },
                    function(err) {
                        ngProgress.complete();
                        $("#search_btn").prop("disabled", false);
                        toastr.error("Unable to retrieve data. Please contact the administrator.");
                    }
                );
            };

            if ($scope.search.term && $scope.search.location) {
                $scope.run();
            }

            $scope.use = function(result) {
                $uibModalInstance.close(result);
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss("cancel");
            };
        }]);
});
