'use strict';
define([
    'app',
    '../../components/inputmask/module.js',
    '../../components/ngEnter/module.js',
    '../../components/dialog/module.js'
], function (app) {
     app.controller
        ('marketSurveyController', ['$scope', '$modalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService','$dialog', function ($scope, $modalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService, $dialog) {

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

                $scope.survey = {floorplans: $scope.property.floorplans}

                $scope.survey.floorplans.forEach(function(fp) {
                    fp.rent = fp.rent || 0;
                    fp.concessions = fp.concessions || 0;
                })
                $scope.survey.occupancy = $scope.survey.occupancy || 0;
                $scope.survey.weeklytraffic = $scope.survey.weeklytraffic || 0;
                $scope.survey.weeklyleases = $scope.survey.weeklyleases || 0;

                $scope.originalSurvey = _.cloneDeep($scope.survey);

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
                            if (!state) {
                                $scope.survey.occupancy = $scope.originalSurvey.occupancy;
                                window.setTimeout(function() {
                                    $('#occupancy')[0].focus();
                                    $('#occupancy')[0].select();
                                }, 300);
                            } else {
                                if ($scope.originalSurvey.occupancy > 0) {
                                    var percent = Math.abs((parseInt($scope.survey.occupancy) - parseInt($scope.originalSurvey.occupancy)) / parseInt($scope.originalSurvey.occupancy) * 100);
                                    if (percent >= 10) {
                                        toastr.warning('<b>Warning:</b> The updated value has changed by over 10%');
                                    }
                                }
                            }
                            break;
                        case "traffic":
                            $scope.survey.trafficupdated = state;
                            if (!state) {
                                $scope.survey.weeklytraffic = $scope.originalSurvey.weeklytraffic;
                                window.setTimeout(function() {
                                    $('#traffic')[0].focus();
                                    $('#traffic')[0].select();
                                }, 300);
                            }
                            break;
                        case "leases":
                            $scope.survey.leasesupdated = state;
                            if (!state) {
                                $scope.survey.weeklyleases = $scope.originalSurvey.weeklyleases;
                                window.setTimeout(function() {
                                    $('#leases')[0].focus();
                                    $('#leases')[0].select();
                                }, 300);
                            }
                            break;

                    }
                }
                else {
                    fp.updated = state;

                    if (!state) {
                        var old = _.find($scope.originalSurvey.floorplans, function(o) {return o.id ==  fp.id})
                        fp.rent = old.rent;
                        fp.concessions = old.concessions;

                        window.setTimeout(function() {
                            $('#rent-' + fp.id)[0].focus();
                            $('#rent-' + fp.id)[0].select();
                        }, 300);
                    }
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

            $scope.create = function() {
                var isSuccess = true;
                var error = "";

                var tenpercent = false;
                $scope.survey.floorplans.forEach(function(fp) {
                    if (isSuccess && (!fp.updated || fp.rent === '' || fp.concessions === '')) {
                        isSuccess = false;
                        error = 'Please update all fields.';
                    }
                    else if (isSuccess) {

                        var old = _.find($scope.originalSurvey.floorplans, function(o) {return o.id ==  fp.id})

                        if (old.rent > 0) {
                            var percent = Math.abs((parseInt(fp.rent) - parseInt(old.rent)) / parseInt(old.rent) * 100);
                            if (percent >= 10) {
                                tenpercent = true;
                            }
                        }
                    }

                })

                if (isSuccess && (!$scope.survey.occupancyupdated || $scope.survey.occupancy === '')) {
                    isSuccess = false;
                    error = 'Please update all fields.';
                }

                if (isSuccess && (!$scope.survey.trafficupdated || $scope.survey.weeklytraffic === '')) {
                    isSuccess = false;
                    error = 'Please update all fields.';
                }

                if (isSuccess && (!$scope.survey.leasesupdated || $scope.survey.weeklyleases === '')) {
                    isSuccess = false;
                    error = 'Please update all fields.';
                }

                if (isSuccess) {

                    var percent = Math.abs((parseInt($scope.survey.occupancy) - parseInt($scope.originalSurvey.occupancy)) / parseInt($scope.originalSurvey.occupancy) * 100);
                    if (percent >= 10) {
                        tenpercent = true;
                    }

                    if (tenpercent) {
                        $dialog.confirm('One or more values have been changed by 10% or more. Are you sure you want to submit this market survey?', function() {
                            $scope.success();
                        }, function() {});
                    }
                    else {
                        $scope.success();
                    }

                } else {
                    toastr.error(error);
                }
            }

            $scope.success = function() {
                $rootScope.$broadcast('data.reload');
                toastr.success('Market Survey Updated Sucessfully.');
                $modalInstance.close();
            }

    }]);


});