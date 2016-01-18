'use strict';
define([
    'app',
    '../../components/ngEnter/module.js',
    '../../components/dialog/module.js'
], function (app) {
     app.controller
        ('marketSurveyController', ['$scope', '$modalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService','$dialog', 'surveyid', function ($scope, $modalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService, $dialog, surveyid) {

            $scope.editableSurveyId = surveyid;

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $propertyService.search({
                limit: 1,
                permission: ['PropertyManage','CompManage'],
                ids: [id],
                select: "_id name floorplans contactName contactEmail phone location_amenities community_amenities survey.id"
            }).then(function (response) {
                $scope.property = response.data.properties[0]
                $scope.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                $scope.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                $scope.hasPhone = $scope.property.phone && $scope.property.phone.length > 0;
                $scope.hasContact = $scope.hasName || $scope.hasEmail || $scope.hasPhone;

                $scope.survey = {floorplans: $scope.property.floorplans, location_amenities: $scope.property.location_amenities, community_amenities: $scope.property.community_amenities}

                $scope.survey.floorplans.forEach(function(fp) {
                    fp.rent = fp.rent || 0;
                    fp.concessions = fp.concessions || 0;
                })
                $scope.survey.leased = $scope.survey.leased || 0;
                $scope.survey.occupancy = $scope.survey.occupancy || 0;
                $scope.survey.weeklytraffic = $scope.survey.weeklytraffic || 0;
                $scope.survey.weeklyleases = $scope.survey.weeklyleases || 0;

                if (!$scope.editableSurveyId && $scope.property.survey) {
                    $scope.editableSurveyId = $scope.property.survey.id;
                }

                if ($scope.property.survey && $scope.editableSurveyId) {
                    $propertyService.getSurvey(id,$scope.editableSurveyId).then(function(response) {
                        var s= response.data.survey;
                        if (s && s.length > 0) {
                            s = s[0];
                            $scope.survey.leased = s.leased;
                            $scope.survey.occupancy = s.occupancy;
                            $scope.survey.weeklytraffic = s.weeklytraffic
                            $scope.survey.weeklyleases = s.weeklyleases

                            $scope.survey.floorplans.forEach(function(fp) {
                                var old = _.find(s.floorplans, function(ofp) {return ofp.id.toString() == fp.id.toString()})

                                if (old) {
                                    fp.rent = old.rent;
                                    fp.concessions = old.concessions;
                                }
                            })

                            if (surveyid) {
                                $scope.editMode = true;
                                $scope.editDate = s.date;
                            }
                        }

                        $scope.doneLoading();
                    })
                } else {
                    $scope.doneLoading();
                }


            });

            $scope.doneLoading = function() {
                $scope.originalSurvey = _.cloneDeep($scope.survey);

                $scope.localLoading = true;
                window.setTimeout(function() {
                    var first = $('.survey-values').find('input')[0];
                    first.focus();
                    first.select();
                }, 300);
            }

            $scope.updateDone = function(fp, state) {

                if (typeof fp == 'string') {
                    switch(fp) {
                        case "leased":
                            if (!state) {
                                $scope.survey.leased = $scope.originalSurvey.leased;
                                window.setTimeout(function() {
                                    $('#leased')[0].focus();
                                    $('#leased')[0].select();
                                }, 300);
                            } else {
                                var er = "";

                                if ($scope.survey.leased && parseFloat($scope.survey.leased) > 100) {
                                    er = '<b>Warning:</b> Leased cannot exceed 100%';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        $('#leased')[0].focus();
                                        $('#leased')[0].select();
                                    }, 300);
                                    return;
                                }

                            }
                            $scope.survey.leasedupdated = state;
                            break;
                        case "occupancy":
                            if (!state) {
                                $scope.survey.occupancy = $scope.originalSurvey.occupancy;
                                window.setTimeout(function() {
                                    $('#occupancy')[0].focus();
                                    $('#occupancy')[0].select();
                                }, 300);
                            } else {

                                var er = "";
                                if ($scope.survey.occupancy == null || typeof $scope.survey.occupancy == 'undefined' || isNaN($scope.survey.occupancy) || parseInt($scope.survey.occupancy) < 0) {
                                    er = '<b>Warning:</b> Occupancy must be a positive number';
                                }
                                else
                                if (parseFloat($scope.survey.occupancy) > 100) {
                                    er = '<b>Warning:</b> Occupancy cannot exceed 100%';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        $('#occupancy')[0].focus();
                                        $('#occupancy')[0].select();
                                    }, 300);
                                    return;
                                }

                                if ($scope.originalSurvey.occupancy > 0) {
                                    var percent = Math.abs((parseInt($scope.survey.occupancy) - parseInt($scope.originalSurvey.occupancy)) / parseInt($scope.originalSurvey.occupancy) * 100);
                                    if (percent >= 10) {
                                        toastr.warning('<b>Warning:</b> The updated value has changed by over 10%');
                                    }
                                }
                            }
                            $scope.survey.occupancyupdated = state;
                            break;
                        case "traffic":

                            if (!state) {
                                $scope.survey.weeklytraffic = $scope.originalSurvey.weeklytraffic;
                                window.setTimeout(function() {
                                    $('#traffic')[0].focus();
                                    $('#traffic')[0].select();
                                }, 300);
                            } else {
                                var er = "";
                                if ($scope.survey.weeklytraffic == null || typeof $scope.survey.weeklytraffic == 'undefined' || isNaN($scope.survey.weeklytraffic) || parseInt($scope.survey.weeklytraffic) < 0) {
                                    er = '<b>Warning:</b> Traffic/Week must be a positive number';
                                }
                                else
                                if ($scope.survey.weeklytraffic.toString().indexOf('.') > -1) {
                                    er = '<b>Warning:</b> Traffic/Week must not include any decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        $('#traffic')[0].focus();
                                        $('#traffic')[0].select();
                                    }, 300);
                                    return;
                                }
                            }

                            $scope.survey.trafficupdated = state;
                            break;
                        case "leases":

                            if (!state) {
                                $scope.survey.weeklyleases = $scope.originalSurvey.weeklyleases;
                                window.setTimeout(function() {
                                    $('#leases')[0].focus();
                                    $('#leases')[0].select();
                                }, 300);
                            } else {
                                var er = "";
                                if ($scope.survey.weeklyleases == null || typeof $scope.survey.weeklyleases == 'undefined' || isNaN($scope.survey.weeklyleases) || parseInt($scope.survey.weeklyleases) < 0) {
                                    er = '<b>Warning:</b> Leases/Week must be a positive number';
                                }
                                else
                                if ($scope.survey.weeklyleases.toString().indexOf('.') > -1) {
                                    er = '<b>Warning:</b> Leases/Week must not include any decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        $('#leases')[0].focus();
                                        $('#leases')[0].select();
                                    }, 300);
                                    return;
                                }
                            }

                            $scope.survey.leasesupdated = state;
                            break;

                    }
                }
                else {
                    var old = _.find($scope.originalSurvey.floorplans, function(o) {return o.id ==  fp.id})

                    if (!state) {
                        fp.rent = old.rent;
                        fp.concessions = old.concessions;

                        window.setTimeout(function() {
                            $('#rent-' + fp.id)[0].focus();
                            $('#rent-' + fp.id)[0].select();
                        }, 300);
                    } else {
                        var er = "";
                        if (fp.rent == null || typeof fp.rent == 'undefined' || isNaN(fp.rent) || parseInt(fp.rent) < 0 ) {
                            er = '<b>Warning:</b> Rent must be a positive number';
                        }
                        else
                        if (fp.rent.toString().indexOf('.') > -1) {
                            er = '<b>Warning:</b> Rent must not include any decimals';
                        }

                        if (er.length > 0) {
                            toastr.warning(er);
                            window.setTimeout(function() {
                                $('#rent-' + fp.id)[0].focus();
                                $('#rent-' + fp.id)[0].select();
                            }, 300);
                            return;
                        }


                        if (fp.concessions == null || typeof fp.concessions == 'undefined' || isNaN(fp.concessions) || parseInt(fp.concessions) < 0) {
                            er = '<b>Warning:</b> Concessions must be a positive number';
                        }
                        else
                        if (fp.concessions.toString().indexOf('.') > -1) {
                            er = '<b>Warning:</b> Concessions must not include any decimals';
                        }

                        if (er.length > 0) {
                            toastr.warning(er);
                            window.setTimeout(function() {
                                $('#concessions-' + fp.id)[0].focus();
                                $('#concessions-' + fp.id)[0].select();
                            }, 300);
                            return;
                        }

                        if (old.rent > 0) {
                            var percent = Math.abs((parseInt(fp.rent) - parseInt(old.rent)) / parseInt(old.rent) * 100);
                            if (percent >= 10) {
                                toastr.warning('<b>Warning:</b> The updated value has changed by over 10%');
                            }
                        }
                    }

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

                if ($rootScope.me.settings.showLeased && isSuccess && (!$scope.survey.leasedupdated)) {
                    isSuccess = false;
                    error = 'Please update all fields.';
                }

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

                    if ($scope.originalSurvey.occupancy > 0) {
                        var percent = Math.abs((parseInt($scope.survey.occupancy) - parseInt($scope.originalSurvey.occupancy)) / parseInt($scope.originalSurvey.occupancy) * 100);
                        if (percent >= 10) {
                            tenpercent = true;
                        }
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

            var surveyError = function (err) {
                $('button.contact-submit').prop('disabled', false);
                toastr.error('Unable to perform action. Please contact an administrator');
                ngProgress.complete();
            };

            var surveySuccess = function(resp) {
                $('button.contact-submit').prop('disabled', false);
                ngProgress.complete();
                if (resp.data.errors && resp.data.errors.length > 0) {
                    var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                    toastr.error(errors);
                }
                else {
                    $rootScope.$broadcast('data.reload');
                    toastr.success('Market Survey Updated Sucessfully.');
                    $modalInstance.close();
                }
            }

            $scope.success = function() {

                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                if (surveyid) {
                    $propertyService.updateSurvey(id, surveyid, $scope.survey).then(surveySuccess, surveyError)
                }
                else {
                    $propertyService.createSurvey(id, $scope.survey).then(surveySuccess, surveyError)
                }


            }

    }]);


});