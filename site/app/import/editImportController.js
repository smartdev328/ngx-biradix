"use strict";
define([
    "app",
    "async",
], function(app, async) {
    app.controller("editImportController", ["$scope", "$uibModalInstance", "config", "orgs", "$importService", "ngProgress", "toastr", "$rootScope",
        function($scope, $uibModalInstance, config, orgs, $importService, ngProgress, toastr, $rootScope) {
            $scope.config = _.cloneDeep(config) || {provider: "YARDI", orgid: "", identity: ""};
            $scope.edit = config;
            $scope.orgs = _.cloneDeep(orgs);
            $scope.orgs.unshift({_id: "", name: "Please Select"});

            $scope.selectedOrg = _.find($scope.orgs, function(o) {
                return o._id.toString() === $scope.config.orgid;
            });

            ga("set", "title", "/editImport");
            ga("set", "page", "/editImport");
            ga("send", "pageview");

            $scope.cancel = function() {
                $uibModalInstance.dismiss("cancel");
            };

            $scope.save = function() {
                var obj = {
                    provider: $scope.config.provider,
                    orgid: $scope.selectedOrg._id,
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
