'use strict';
define([
    'app',
    '../../components/ngEnter/module.js',
    '../../components/dialog/module.js'
], function (app) {
     app.controller
        ('marketSurveyController', ['$scope', '$modalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService','$dialog', 'surveyid', '$authService', function ($scope, $modalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService, $dialog, surveyid,$authService) {

            $scope.editableSurveyId = surveyid;
            $scope.settings = {showNotes : false, showDetailed: false};


            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.clear = function(id) {
                $("#" + id).parent().removeClass("has-error");
            }

            $scope.pressed = function(row,id,event) {
                //Tab
                if (event.keyCode == 9 && !event.shiftKey) {
                    event.preventDefault();
                    $scope.next(row,id);
                }
            }

            $scope.toggleConcessions = function() {
                $rootScope.me.settings.monthlyConcessions = $scope.settings.showDetailed;
                $authService.updateSettings($rootScope.me.settings);

                if (!$scope.settings.showDetailed) {
                    $scope.survey.floorplans.forEach(function(fp) {
                        if (fp.concessionsOneTime && fp.concessionsMonthly
                            && !isNaN(fp.concessionsOneTime)&& !isNaN(fp.concessionsMonthly)) {
                            fp.concessions = fp.concessionsOneTime +  fp.concessionsMonthly * 12;
                        }
                    })
                }
            }

            var me = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    me();
                    $scope.settings.showDetailed = $rootScope.me.settings.monthlyConcessions;

                    $propertyService.search({
                        limit: 1,
                        permission: ['PropertyManage', 'CompManage'],
                        ids: [id],
                        select: "_id name floorplans contactName contactEmail phone location_amenities community_amenities survey.id"
                    }).then(function (response) {
                        $scope.property = response.data.properties[0]
                        $scope.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                        $scope.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                        $scope.hasPhone = $scope.property.phone && $scope.property.phone.length > 0;
                        $scope.hasContact = $scope.hasName || $scope.hasEmail || $scope.hasPhone;

                        $scope.survey = {
                            floorplans: $scope.property.floorplans,
                            location_amenities: $scope.property.location_amenities,
                            community_amenities: $scope.property.community_amenities
                        }

                        $scope.survey.floorplans.forEach(function (fp) {
                            fp.rent = fp.rent || ''
                            fp.concessions = fp.concessions || '';
                        })
                        $scope.survey.leased = $scope.survey.leased || '';
                        $scope.survey.occupancy = $scope.survey.occupancy || '';
                        $scope.survey.weeklytraffic = $scope.survey.weeklytraffic || '';
                        $scope.survey.weeklyleases = $scope.survey.weeklyleases || '';

                        if (!$scope.editableSurveyId && $scope.property.survey) {
                            $scope.editableSurveyId = $scope.property.survey.id;
                        }

                        if ($scope.property.survey && $scope.editableSurveyId) {
                            $propertyService.getSurvey(id, $scope.editableSurveyId).then(function (response) {
                                var s = response.data.survey;
                                if (s && s.length > 0) {
                                    s = s[0];
                                    $scope.survey.leased = s.leased;
                                    $scope.survey.occupancy = s.occupancy;
                                    $scope.survey.weeklytraffic = s.weeklytraffic
                                    $scope.survey.weeklyleases = s.weeklyleases
                                    $scope.survey.notes = s.notes;
                                    $scope.settings.showNotes = (s.notes || '') != '';

                                    $scope.survey.floorplans.forEach(function (fp) {
                                        var old = _.find(s.floorplans, function (ofp) {
                                            return ofp.id.toString() == fp.id.toString()
                                        })

                                        if (old) {
                                            fp.rent = old.rent;
                                            fp.concessions = old.concessions;
                                            fp.concessionsOneTime = old.concessionsOneTime;
                                            fp.concessionsMonthly = old.concessionsMonthly;
                                        }

                                        if (typeof fp.concessionsOneTime != 'undefined') {
                                            $scope.settings.showDetailed = true;
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

            $scope.updateDone = function(fp, state, fp_field) {

                fp_field = fp_field || '';

                if (typeof fp == 'string') {
                    switch(fp) {
                        case "leased":
                            $scope.leasedWarning = false;
                            if (!state) {
                                $scope.survey.leased = $scope.originalSurvey.leased;
                                window.setTimeout(function() {
                                    //$('#leased')[0].focus();
                                    //$('#leased')[0].select();
                                    $('#leased').parent().removeClass("has-error");
                                }, 300);
                            } else {
                                var er = "";

                                if ($scope.survey.leased && parseFloat($scope.survey.leased) > 100) {
                                    er = '<b>Warning:</b> Leased cannot exceed 100%';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#leased')[0].focus();
                                        //$('#leased')[0].select();
                                        $('#leased').parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }

                                if ($scope.originalSurvey.leased && $scope.originalSurvey.leased > 0 && $scope.survey.leased) {
                                    var percent = Math.abs((parseInt($scope.survey.leased) - parseInt($scope.originalSurvey.leased)) / parseInt($scope.originalSurvey.leased) * 100);
                                    if (percent >= 10) {
                                        $scope.leasedWarning = true;
                                    }
                                }

                            }
                            $scope.survey.leasedupdated = $scope.survey.leased != $scope.originalSurvey.leased;;
                            break;
                        case "occupancy":
                            $scope.occupancyWarning = false;
                            if (!state) {
                                $scope.survey.occupancy = $scope.originalSurvey.occupancy;
                                window.setTimeout(function() {
                                    //$('#occupancy')[0].focus();
                                    //$('#occupancy')[0].select();
                                    $('#occupancy').parent().removeClass("has-error");
                                }, 300);
                            } else {

                                var er = "";
                                if (typeof $scope.survey.occupancy == 'undefined' || ($scope.survey.occupancy && !isNaN($scope.survey.occupancy) && (parseFloat($scope.survey.occupancy) > 100 || parseFloat($scope.survey.occupancy) < 0))) {
                                    er = '<b>Warning:</b> Occupancy must be between 0% and 100%';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#occupancy')[0].focus();
                                        //$('#occupancy')[0].select();
                                        $('#occupancy').parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }

                                if ($scope.originalSurvey.occupancy > 0) {
                                    var percent = Math.abs((parseInt($scope.survey.occupancy) - parseInt($scope.originalSurvey.occupancy)) / parseInt($scope.originalSurvey.occupancy) * 100);
                                    if (percent >= 10) {
                                        $scope.occupancyWarning = true;
                                    }
                                }
                            }
                            $scope.survey.occupancyupdated = $scope.survey.occupancy != $scope.originalSurvey.occupancy;
                            break;
                        case "traffic":

                            if (!state) {
                                $scope.survey.weeklytraffic = $scope.originalSurvey.weeklytraffic;
                                window.setTimeout(function() {
                                    //$('#traffic')[0].focus();
                                    //$('#traffic')[0].select();
                                    $('#traffic').parent().removeClass("has-error");
                                }, 300);
                            } else {
                                var er = "";

                                if (typeof $scope.survey.weeklytraffic == 'undefined' || ($scope.survey.weeklytraffic != null && !isNaN($scope.survey.weeklytraffic) && $scope.survey.weeklytraffic.toString().indexOf('.') > -1)) {
                                    er = '<b>Warning:</b> Traffic/Week must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#traffic')[0].focus();
                                        //$('#traffic')[0].select();
                                        $('#traffic').parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }
                            }

                            $scope.survey.trafficupdated = $scope.survey.weeklytraffic != $scope.originalSurvey.weeklytraffic;
                            break;
                        case "leases":

                            if (!state) {
                                $scope.survey.weeklyleases = $scope.originalSurvey.weeklyleases;
                                window.setTimeout(function() {
                                    //$('#leases')[0].focus();
                                    //$('#leases')[0].select();
                                    $('#leases').parent().removeClass("has-error");
                                }, 300);
                            } else {
                                var er = "";
                                if (typeof $scope.survey.weeklyleases == 'undefined' || ($scope.survey.weeklyleases != null && !isNaN($scope.survey.weeklyleases) && $scope.survey.weeklyleases.toString().indexOf('.') > -1)) {
                                    er = '<b>Warning:</b> Leases/Week must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#leases')[0].focus();
                                        //$('#leases')[0].select();
                                        $('#leases').parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }
                            }

                            $scope.survey.leasesupdated = $scope.survey.weeklyleases != $scope.originalSurvey.weeklyleases;
                            break;

                    }
                }
                else {
                    fp.warning = false;

                    var old = _.find($scope.originalSurvey.floorplans, function(o) {return o.id ==  fp.id})

                    if (old && old.rent) {
                        old.ner = old.rent - old.concessions / 12;
                    }

                    if (!state) {
                        fp.rent = old.rent;
                        fp.concessions = old.concessions;
                        fp.concessionsMonthly = old.concessionsMonthly;
                        fp.concessionsOneTime = old.concessionsOneTime;
                        fp.warning = false;

                        window.setTimeout(function() {
                            //$('#rent-' + fp.id)[0].focus();
                            //$('#rent-' + fp.id)[0].select();
                            $('#rent-' + fp.id).parent().removeClass("has-error");
                            $('#concessionsOneTime-' + fp.id).parent().removeClass("has-error");
                            $('#concessionsMonthly-' + fp.id).parent().removeClass("has-error");
                            $('#concessions-' + fp.id).parent().removeClass("has-error");
                        }, 300);
                    } else {
                        var er = "";

                        if (fp_field == 'rent') {

                            if (typeof fp.rent == 'undefined' || (fp.rent != null && !isNaN(fp.rent) && fp.rent.toString().indexOf('.') > -1)) {
                                er = '<b>Warning:</b> Rent must be 0 or greater, no decimals';
                            }

                            if (er.length > 0) {
                                toastr.warning(er);
                                window.setTimeout(function () {
                                    //$('#rent-' + fp.id)[0].focus();
                                    //$('#rent-' + fp.id)[0].select();
                                    $('#rent-' + fp.id).parent().addClass("has-error");
                                }, 300);
                                return;

                            }
                        }


                        if ($scope.settings.showDetailed) {

                            if (fp_field == 'concessionsOneTime') {
                                if (typeof fp.concessionsOneTime == 'undefined' || (fp.concessionsOneTime != null && !isNaN(fp.concessionsOneTime) && fp.concessionsOneTime.toString().indexOf('.') > -1)) {
                                    er = '<b>Warning:</b> Concessions must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function () {
                                        //$('#concessionsOneTime-' + fp.id)[0].focus();
                                        //$('#concessionsOneTime-' + fp.id)[0].select();
                                        $('#concessionsOneTime-' + fp.id).parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }
                            }

                            if (fp_field == 'concessionsMonthly') {
                                if (typeof fp.concessionsMonthly == 'undefined' || (fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly) && fp.concessionsMonthly.toString().indexOf('.') > -1)) {
                                    er = '<b>Warning:</b> Concessions must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function () {
                                        //$('#concessionsMonthly-' + fp.id)[0].focus();
                                        //$('#concessionsMonthly-' + fp.id)[0].select();
                                        $('#concessionsMonthly-' + fp.id).parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }
                            }
                        }
                        else {
                            if (fp_field == 'concessions') {
                                if (typeof fp.concessions == 'undefined' || (fp.concessions != null && !isNaN(fp.concessions) && fp.concessions.toString().indexOf('.') > -1)) {
                                    er = '<b>Warning:</b> Concessions must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function () {
                                        $('#concessions-' + fp.id)[0].focus();
                                        $('#concessions-' + fp.id)[0].select();
                                        $('#concessions-' + fp.id).parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }
                            }
                        }

                        if (old.rent > 0) {

                            if ($scope.settings.showDetailed) {
                                fp.ner = fp.rent - (fp.concessionsOneTime || 0) / 12 - (fp.concessionsMonthly || 0);
                            } else {
                                fp.ner = fp.rent - (fp.concessions || 0) / 12;
                            }

                            var percent = Math.abs((parseInt(fp.ner) - parseInt(old.ner)) / parseInt(old.ner) * 100);
                            if (percent >= 10) {
                                fp.warning = true;
                            }
                        }
                    }

                    if ($scope.settings.showDetailed) {
                        fp.updated = parseInt(fp.rent || '0') != parseInt(old.rent || '0') || parseInt(fp.concessionsOneTime || '0') != parseInt(old.concessionsOneTime || '0') || parseInt(fp.concessionsMonthly || '0') != parseInt(old.concessionsMonthly || '0');
                    } else {
                        fp.updated = parseInt(fp.rent || '0') != parseInt(old.rent || '0') || parseInt(fp.concessions || '0') != parseInt(old.concessions || '0');
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

                //if (id.indexOf("rent") == -1 && id.indexOf("concessionsOneTime") == -1) {
                    //$scope.update(fp)
                //}
            }

            $scope.create = function() {
                var isSuccess = true;
                var error = "";

                var tenpercent = false;
                $scope.survey.floorplans.forEach(function(fp) {

                    if (fp.rent == null || typeof fp.rent == 'undefined' || isNaN(fp.rent) || parseInt(fp.rent) < 1 ) {
                        isSuccess = false;
                        error = 'Please update the highlighted required fields.';
                        $('#rent-' + fp.id).parent().addClass("has-error");
                    }
                    else
                    if (fp.rent.toString().indexOf('.') > -1) {
                        isSuccess = false;
                        error = 'Please update the highlighted required fields.';
                        $('#rent-' + fp.id).parent().addClass("has-error");
                    }

                    if ($scope.settings.showDetailed) {
                        if (fp.concessionsOneTime == null || typeof fp.concessionsOneTime == 'undefined' || isNaN(fp.concessionsOneTime) || parseInt(fp.concessionsOneTime) < 0) {
                            isSuccess = false;
                            error = 'Please update the highlighted required fields.';
                            $('#concessionsOneTime-' + fp.id).parent().addClass("has-error");
                        }
                        else if (fp.concessionsOneTime.toString().indexOf('.') > -1) {
                            isSuccess = false;
                            error = 'Please update the highlighted required fields.';
                            $('#concessionsOneTime-' + fp.id).parent().addClass("has-error");
                        }

                        if (fp.concessionsMonthly == null || typeof fp.concessionsMonthly == 'undefined' || isNaN(fp.concessionsMonthly) || parseInt(fp.concessionsMonthly) < 0) {
                            isSuccess = false;
                            error = 'Please update the highlighted required fields.';
                            $('#concessionsMonthly-' + fp.id).parent().addClass("has-error");
                        }
                        else if (fp.concessionsMonthly.toString().indexOf('.') > -1) {
                            isSuccess = false;
                            error = 'Please update the highlighted required fields.';
                            $('#concessionsMonthly-' + fp.id).parent().addClass("has-error");
                        }
                    } else {
                        if (fp.concessions == null || typeof fp.concessions == 'undefined' || isNaN(fp.concessions) || parseInt(fp.concessions) < 0) {
                            isSuccess = false;
                            error = 'Please update the highlighted required fields.';
                            $('#concessions-' + fp.id).parent().addClass("has-error");
                        }
                        else if (fp.concessions.toString().indexOf('.') > -1) {
                            isSuccess = false;
                            error = 'Please update the highlighted required fields.';
                            $('#concessions-' + fp.id).parent().addClass("has-error");
                        }
                    }

                    if (isSuccess) {
                        var old = _.find($scope.originalSurvey.floorplans, function(o) {return o.id ==  fp.id})

                        if (old.rent > 0) {
                            var percent = Math.abs((parseInt(fp.rent) - parseInt(old.rent)) / parseInt(old.rent) * 100);
                            if (percent >= 10) {
                                tenpercent = true;
                            }
                        }
                    }

                })


                if ($scope.survey.occupancy == null || typeof $scope.survey.occupancy == 'undefined' || isNaN($scope.survey.occupancy) || parseInt($scope.survey.occupancy) < 0) {
                    isSuccess = false;
                    error = 'Please update the highlighted required fields.';
                    $('#occupancy').parent().addClass("has-error");
                }

                if ($scope.survey.weeklytraffic == null || typeof $scope.survey.weeklytraffic == 'undefined' || isNaN($scope.survey.weeklytraffic) || parseInt($scope.survey.weeklytraffic) < 0) {
                    isSuccess = false;
                    error = 'Please update the highlighted required fields.';
                }

                if ($scope.survey.weeklyleases == null || typeof $scope.survey.weeklyleases == 'undefined' || isNaN($scope.survey.weeklyleases) || parseInt($scope.survey.weeklyleases) < 0) {
                    isSuccess = false;
                    error = 'Please update the highlighted required fields.';
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

                if ($scope.settings.showDetailed) {
                    $scope.survey.floorplans.forEach(function (fp) {
                        if (fp.concessionsOneTime && fp.concessionsMonthly
                            && !isNaN(fp.concessionsOneTime) && !isNaN(fp.concessionsMonthly)) {
                            fp.concessions = fp.concessionsOneTime + fp.concessionsMonthly * 12;
                        } else {
                            fp.concessions = 0;
                        }

                    })
                } else {
                    $scope.survey.floorplans.forEach(function (fp) {
                        delete fp.concessionsOneTime;
                        delete fp.concessionsMonthly;
                    })
                }

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