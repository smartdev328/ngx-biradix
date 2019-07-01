"use strict";
define([
    "app",
    "async",
], function(app, async) {
    app.controller("editImportController", ["$scope", "$uibModalInstance", "config", "orgs", "$importService", "ngProgress", "toastr", "$rootScope",
        function($scope, $uibModalInstance, config, orgs, $importService, ngProgress, toastr, $rootScope) {
            $scope.config = _.cloneDeep(config) || {provider: "YARDI", orgid: "", identity: "", timeZone: "America/Los_Angeles"};
            $scope.edit = config;
            $scope.orgs = _.cloneDeep(orgs);
            $scope.orgs.unshift({_id: "", name: "Please Select"});
            $scope.model = {
                selectedTimeZone: null
            };


            ga("set", "title", "/editImport");
            ga("set", "page", "/editImport");
            ga("send", "pageview");

            $scope.cancel = function() {
                $uibModalInstance.dismiss("cancel");
            };

            $scope.timezones = [
                {id: 'America/Los_Angeles', name: "Los Angeles (Pacific)"},
                {id: 'America/Phoenix', name: "Phoenix (Arizona)"},
                {id: 'America/Denver', name: "Denver (Mountain)"},
                {id: 'America/Chicago', name: "Chicago (Central)"},
                {id: 'America/New_York', name: "New York (Eastern)"},
            ];

            $scope.selectedOrg = _.find($scope.orgs, function(o) {
                return o._id.toString() === $scope.config.orgid;
            });
            $scope.model.selectedTimeZone = _.find($scope.timezones, function(o) {
                return o.id.toString() === $scope.config.timeZone;
            });


            $scope.save = function() {
                var obj = {
                    provider: $scope.config.provider,
                    orgid: $scope.selectedOrg._id,
                    timeZone: $scope.model.selectedTimeZone.id,
                    yardi: {
                        folder: $scope.config.identity
                    }
                };

                if ($scope.edit) {
                    obj.id = config.id;
                    obj.isActive = config.isActive;

                    ngProgress.start();
                    $importService.update(obj).then(function(response) {
                            var ret = _.cloneDeep(response.data);
                            ret.org = $scope.selectedOrg.name;
                            $uibModalInstance.close(ret);
                            ngProgress.reset();
                        },
                        function(error) {
                            if (error.status === 400) {
                                toastr.error(error.data);
                            } else {
                                toastr.error("Unable to create PMS Config. Please contact an administrator.");
                            }

                            ngProgress.reset();
                        });
                } else {
                    obj.isActive = true;

                    ngProgress.start();

                    $importService.create(obj).then(function(response) {
                        var ret = _.cloneDeep(response.data);
                        ret.org = $scope.selectedOrg.name;
                        $uibModalInstance.close(ret);
                        ngProgress.reset();
                    },
                    function(error) {
                        if (error.status === 400) {
                            toastr.error(error.data);
                        } else {
                            toastr.error("Unable to create PMS Config. Please contact an administrator.");
                        }

                        ngProgress.reset();
                    });
                }
            };
        }]);
});
