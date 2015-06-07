'use strict';
define([
    'app',
    '../../components/inputmask/module.js',
    '../../components/ngEnter/module.js',
], function (app) {
     app.controller
        ('marketSurveyController', ['$scope', '$modalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $propertyService.search({
                limit: 1,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name floorplans contactName contactEmail phone"
            }).then(function (response) {
                $scope.property = response.data.properties[0]
                $scope.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                $scope.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                $scope.hasPhone = $scope.property.phone && $scope.property.phone.length > 0;
                $scope.hasContact = $scope.hasName || $scope.hasEmail || $scope.hasPhone;

                $scope.survey = {}

                $scope.property.floorplans.forEach(function(fp) {
                    fp.rent = 0;
                    fp.concessions = 0;
                })
                $scope.localLoading = true;
                window.setTimeout(function() {
                    var first = $('.survey-values').find('input')[0];
                    first.focus();
                    first.select();
                }, 300);

            });

            $scope.updateDone = function(fp, state) {
                if (typeof fp == 'string') {
                    switch(fp) {
                        case "occupancy":
                            $scope.survey.occupancyupdated = state;
                            break;
                        case "traffic":
                            $scope.survey.trafficupdated = state;
                            break;
                        case "leases":
                            $scope.survey.leasesupdated = state;
                            break;

                    }
                }
                else {
                    fp.updated = state;
                }

            }

            $scope.update = function(fp) {
                $scope.updateDone(fp, true);
            }

            $scope.undo = function(fp) {
                $scope.updateDone(fp, false);
            }

            $scope.next = function(fp, id) {
                var all = $('.survey-values input');

                if (all.length == 0) {
                    return;
                }

                var first = all.first();
                var current = all.find('#' + id)

                var next = 0;
                all.each(function(i, v) {
                    if (v.id == id) {
                        next = i + 1;
                    }
                })

                if (next >= all.length) {
                    next = 0;
                }
                all[next].focus();
                all[next].select();

                if (id.indexOf("rent") == -1) {
                    $scope.update(fp)
                }
            }

}]);

});