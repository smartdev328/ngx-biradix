"use strict";
define([
    "app",
    "async",
], function (app, async) {
    app.controller("editImportController", ["$scope", "$uibModalInstance", "config", "$importService", "ngProgress", "toastr", "$rootScope", "$q",
        function ($scope, $uibModalInstance, config, $importService, ngProgress, toastr, $rootScope, $q) {
            $scope.config = _.cloneDeep(config);

            ga("set", "title", "/editImport");
            ga("set", "page", "/editImport");
            ga("send", "pageview");

            $scope.cancel = function () {
                $uibModalInstance.dismiss("cancel");
            };

            $scope.timezones = [
                { id: 'America/Los_Angeles', name: "Los Angeles (Pacific)" },
                { id: 'America/Phoenix', name: "Phoenix (Arizona)" },
                { id: 'America/Denver', name: "Denver (Mountain)" },
                { id: 'America/Chicago', name: "Chicago (Central)" },
                { id: 'America/New_York', name: "New York (Eastern)" },
            ];

            $scope.statuses = [
                { name: 'Enabled', value: true },
                { name: 'Disabled', value: false }
            ];

            $scope.addRow = function () {
                $scope.config.data.push({
                    id: "",
                    isActive: true,
                    provider: "YARDI",
                    timeZone: "America/Los_Angeles",
                    orgid: $scope.config.data[0].orgid,
                    identity: "",
                    orgName: $scope.config.data[0].orgName,
                    isCreate: true
                });
            }

            $scope.save = function () {
                var imports = $scope.config.data;
                var deferred = $q.defer();
                ngProgress.start();
                imports.reduce(function (p, importObj) {
                    return p.then(function () {
                        var obj = {
                            provider: importObj.provider,
                            orgid: importObj.orgid,
                            timeZone: importObj.timeZone,
                            yardi: {
                                folder: importObj.identity
                            }
                        };

                        if (importObj.isCreate) {
                            obj.isActive = true;
                            return $importService.create(obj);
                        } else {
                            obj.id = importObj.id;
                            obj.isActive = importObj.isActive;
                            return $importService.update(obj);
                        }
                    });
                }, $q.when(true)).then(function (response) {
                    var ret = _.cloneDeep(response.data);
                    ret.org = $scope.config.data[0].orgName;
                    $uibModalInstance.close(ret);
                    ngProgress.reset();
                    deferred.resolve(response);
                }, function (error) {
                    if (error.status === 400) {
                        toastr.error(error.data);
                    } else {
                        toastr.error("Unable to create PMS Config. Please contact an administrator.");
                    }
                    ngProgress.reset();
                    deferred.reject(error.data);
                });
            };

            $scope.remove = function (index) {
                $scope.config.data.splice(index, 1); 
            };
        }]);
});
