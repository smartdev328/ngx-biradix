'use strict';
define([
    'app',
    '../../components/ngEnter/module.js',
    '../../components/dialog/module.js'
], function (app) {
     app.controller
        ('marketSurveyController', ['$scope', '$uibModalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService','$dialog', 'surveyid', '$authService','$auditService','options', function ($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService, $dialog, surveyid,$authService,$auditService, options) {

            $scope.editableSurveyId = surveyid;
            $scope.settings = {showNotes : false, showDetailed: false};


            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            ga('set', 'title', "/marketSurvey");
            ga('set', 'page', "/marketSurvey");
            ga('send', 'pageview');            

            $scope.cancel = function () {
                if ($scope.changed) {
                    $dialog.confirm('You have made changes that have not been saved. Are you sure you want to close without saving?', function () {
                        $uibModalInstance.dismiss('cancel');
                    }, function () {
                    });
                }
                else {
                    $uibModalInstance.dismiss('cancel');
                }
            };

            $scope.changed = false;
            
            $scope.updateChanged = function() {
                $scope.changed = true;
            }

            $scope.clear = function(id) {
                $("#" + id).parent().removeClass("has-error");
            }

            $scope.pressed = function(row,id,event) {
                //Tab
                if (event.keyCode == 9 && !event.shiftKey) {
                    event.preventDefault();
                    $scope.next(row,id);
                } else {
                    if (event.keyCode != 13) {
                        $scope.changed = true;
                    }

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
                            fp.concessions = (fp.concessions || fp.concessions === 0) ?  fp.concessions : '';
                        })
                        $scope.survey.leased = $scope.survey.leased || '';
                        $scope.survey.renewal = $scope.survey.renewal || '';
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
                                    $scope.survey.renewal = s.renewal;
                                    $scope.survey.occupancy = s.occupancy;
                                    $scope.survey.weeklytraffic = s.weeklytraffic
                                    $scope.survey.weeklyleases = s.weeklyleases
                                    $scope.survey.notes = s.notes;
                                    $scope.settings.showNotes = (s.notes || '') != '';

                                    var removeFloorplans = [];

                                    var bFloorplansChanged = false
                                    $scope.survey.floorplans.forEach(function (fp, i) {
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


                                        if (!old) {
                                            //Always Keep track of floorplan changes
                                            bFloorplansChanged = true;

                                            //If we are modifying a survey and there is a new floorplan, exclude it
                                            if (surveyid) {
                                                removeFloorplans.push(fp.id.toString());
                                            }
                                        }
                                    })


                                    var removed = _.remove($scope.survey.floorplans, function(x) {return removeFloorplans.indexOf(x.id.toString()) > -1})


                                    s.floorplans.forEach(function (fp) {
                                        var n = _.find($scope.survey.floorplans, function (nfp) {
                                            return nfp.id.toString() == fp.id.toString()
                                        })

                                        if (!n) {
                                            //Add missing floorplans from survey being edited
                                            if (surveyid) {
                                                $scope.survey.floorplans.push(fp);
                                            }
                                            //Always Keep track of floorplan changes
                                            bFloorplansChanged = true;
                                        }
                                    })


                                    //If Adding a new Survey and no changes in floorplans and there is already a survey today, edit that one
                                    if (!surveyid && !bFloorplansChanged) {
                                        //var hoursOld = ((new Date()).getTime() - (new Date(s.date)).getTime()) / 1000 / 60 / 60;
                                        //if (hoursOld < 24) {
                                        //    surveyid = s._id;
                                        //}
                                        var d1 = new Date();
                                        var d2 = new Date(s.date);
                                        if (d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getYear() == d2.getYear()) {
                                            surveyid = s._id;
                                        }
                                    }



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

                $scope.survey.floorplans.forEach(function(fp) {
                    fp.concessionsOneTime = (fp.concessionsOneTime || fp.concessionsOneTime === 0) ?  fp.concessionsOneTime : '';
                    fp.concessionsMonthly = (fp.concessionsMonthly || fp.concessionsMonthly === 0) ?  fp.concessionsMonthly : '';

                })

                $scope.survey.floorplans = _.sortByAll($scope.survey.floorplans, ['bedrooms', 'bathrooms',  'sqft', 'description', 'units', 'fid'])

                $scope.originalSurvey = _.cloneDeep($scope.survey);

                $scope.localLoading = true;
                window.setTimeout(function() {
                    var first = $('.survey-values').find('input')[0];
                    first.focus();
                    first.select();
                }, 300);

            }

            $scope.isValid  = function(field, required, allowDecimal, min, max) {

                if (required) {

                    if (typeof field === 'undefined' || field === '' || field === null || isNaN(field)) {
                        return false;
                    }
                }


                if (!allowDecimal && field.toString().indexOf('.') > -1) {
                    return false;
                }

                if (typeof field !== 'undefined' && field != null && !isNaN(field)) {
                    if (typeof min !== 'undefined' && parseFloat(field) < min) {
                        return false;
                    }
                    if (typeof max !== 'undefined' && parseFloat(field) > max) {
                        return false;
                    }

                }

                return true
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

                                if (!$scope.isValid($scope.survey.leased, false, true, 0, 150)) {
                                    er = '<b>Warning:</b> Leased must be between 0% and 150%';
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
                        case "renewal":
                            $scope.renewalWarning = false;
                            if (!state) {
                                $scope.survey.renewal = $scope.originalSurvey.renewal;
                                window.setTimeout(function() {
                                    //$('#renewal')[0].focus();
                                    //$('#renewal')[0].select();
                                    $('#renewal').parent().removeClass("has-error");
                                }, 300);
                            } else {
                                var er = "";

                                if (!$scope.isValid($scope.survey.renewal, false, true, 0, 150)) {
                                    er = '<b>Warning:</b> Renewal must be between 0% and 150%';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#renewal')[0].focus();
                                        //$('#renewal')[0].select();
                                        $('#renewal').parent().addClass("has-error");
                                    }, 300);
                                    return;
                                }

                                if ($scope.originalSurvey.renewal && $scope.originalSurvey.renewal > 0 && $scope.survey.renewal) {
                                    var percent = Math.abs((parseInt($scope.survey.renewal) - parseInt($scope.originalSurvey.renewal)) / parseInt($scope.originalSurvey.renewal) * 100);
                                    if (percent >= 10) {
                                        $scope.renewalWarning = true;
                                    }
                                }

                            }
                            $scope.survey.renewalupdated = $scope.survey.renewal != $scope.originalSurvey.renewal;;
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
                                if (!$scope.isValid($scope.survey.occupancy,true,true)) {
                                    er = '<b>Warning:</b> Occupancy must be between 0% and 100%';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#occupancy')[0].focus();
                                        //$('#occupancy')[0].select();
                                        $('#occupancy').parent().addClass("has-error");
                                    }, 300);
                                    //return;
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

                                if (!$scope.isValid($scope.survey.weeklytraffic,true,false)) {
                                    er = '<b>Warning:</b> Traffic/Week must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#traffic')[0].focus();
                                        //$('#traffic')[0].select();
                                        $('#traffic').parent().addClass("has-error");
                                    }, 300);
                                    //return;
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
                                if (!$scope.isValid($scope.survey.weeklyleases,true,false)) {
                                    er = '<b>Warning:</b> Leases/Week must be 0 or greater, no decimals';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        //$('#leases')[0].focus();
                                        //$('#leases')[0].select();
                                        $('#leases').parent().addClass("has-error");
                                    }, 300);
                                    //return;
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

                            if (!$scope.isValid(fp.rent,true,false)) {
                                er = '<b>Warning:</b> Rent must be 1 or greater, no decimals or blank fields';
                            }

                            if (er.length > 0) {
                                toastr.warning(er);
                                window.setTimeout(function () {
                                    //$('#rent-' + fp.id)[0].focus();
                                    //$('#rent-' + fp.id)[0].select();
                                    $('#rent-' + fp.id).parent().addClass("has-error");
                                }, 300);
                                $scope.checkUndoFp(fp,old);
                                return;

                            }
                        }


                        if ($scope.settings.showDetailed) {

                            if (fp_field == 'concessionsOneTime') {
                                //console.log(fp);
                                if (!$scope.isValid(fp.concessionsOneTime,true,false)) {
                                    er = '<b>Warning:</b> Concessions must be 0 or greater, no decimals or blank fields';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function () {
                                        //$('#concessionsOneTime-' + fp.id)[0].focus();
                                        //$('#concessionsOneTime-' + fp.id)[0].select();
                                        $('#concessionsOneTime-' + fp.id).parent().addClass("has-error");
                                    }, 300);
                                    $scope.checkUndoFp(fp,old);
                                    return;
                                }
                            }

                            if (fp_field == 'concessionsMonthly') {
                                if (!$scope.isValid(fp.concessionsMonthly,true,false)) {
                                    er = '<b>Warning:</b> Concessions must be 0 or greater, no decimals or blank fields';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function () {
                                        //$('#concessionsMonthly-' + fp.id)[0].focus();
                                        //$('#concessionsMonthly-' + fp.id)[0].select();
                                        $('#concessionsMonthly-' + fp.id).parent().addClass("has-error");
                                    }, 300);
                                    $scope.checkUndoFp(fp,old);
                                    return;
                                }
                            }
                        }
                        else {
                            if (fp_field == 'concessions') {
                                if (!$scope.isValid(fp.concessions,true,false)) {
                                    er = '<b>Warning:</b> Concessions must be 0 or greater, no decimals or blank fields';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function () {
                                        //$('#concessions-' + fp.id)[0].focus();
                                        //$('#concessions-' + fp.id)[0].select();
                                        $('#concessions-' + fp.id).parent().addClass("has-error");
                                    }, 300);
                                    $scope.checkUndoFp(fp,old);
                                    return;
                                }
                            }
                        }

                        if (old.rent > 0) {

                            if ($scope.settings.showDetailed) {
                                fp.ner = fp.rent - (fp.concessionsOneTime || 0) / 12 - (fp.concessionsMonthly || 0);


                                if (fp.concessionsOneTime === null || typeof fp.concessionsOneTime == 'undefined' || fp.concessionsOneTime === ''
                                    || fp.concessionsMonthly === null || typeof fp.concessionsMonthly == 'undefined' || fp.concessionsMonthly === ''
                                ) {
                                    fp.ner = old.ner;
                                }

                            } else {
                                fp.ner = fp.rent - (fp.concessions || 0) / 12;

                                if (fp.concessions === null || typeof fp.concessions == 'undefined' || fp.concessions === '' ) {
                                    fp.ner = old.ner;
                                }
                            }

                            var percent = Math.abs((parseInt(fp.ner) - parseInt(old.ner)) / parseInt(old.ner) * 100);

                            if (percent >= 10) {
                                fp.warning = true;
                            }
                        }

                    }
                    $scope.checkUndoFp(fp,old);

                }

            }

            $scope.checkUndoFp = function(fp, old) {
                if ($scope.settings.showDetailed) {
                    fp.updated = fp.rent != old.rent || fp.concessionsOneTime != old.concessionsOneTime || fp.concessionsMonthly != old.concessionsMonthly;
                } else {
                    fp.updated = fp.rent != old.rent || fp.concessions != old.concessions;
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

                    if (!$scope.isValid(fp.rent,true,false)) {
                        isSuccess = false;
                        error = 'rent';
                        $('#rent-' + fp.id).parent().addClass("has-error");
                    }

                    if ($scope.settings.showDetailed) {

                        if (!$scope.isValid(fp.concessionsOneTime,true,false)) {
                            isSuccess = false;
                            error = 'concessionsOneTime';
                            $('#concessionsOneTime-' + fp.id).parent().addClass("has-error");
                        }

                        if (!$scope.isValid(fp.concessionsMonthly,true,false)) {
                            isSuccess = false;
                            error = 'concessionsMonthly';
                            $('#concessionsMonthly-' + fp.id).parent().addClass("has-error");
                        }
                    } else {
                        if (!$scope.isValid(fp.concessions,true,false)) {
                            isSuccess = false;
                            error = 'concessions';
                            $('#concessions-' + fp.id).parent().addClass("has-error");
                        }
                    }

                })


                if (!$scope.isValid($scope.survey.occupancy,true,true)) {
                    isSuccess = false;
                    error = 'Occupancy';
                    $('#occupancy').parent().addClass("has-error");
                }

                if (!$scope.isValid($scope.survey.weeklytraffic,true,false)) {
                    isSuccess = false;
                    error = 'Traffic';
                    $('#traffic').parent().addClass("has-error");
                }

                if (!$scope.isValid($scope.survey.weeklyleases,true,false)) {
                    isSuccess = false;
                    error = 'Leases';
                    $('#leases').parent().addClass("has-error");
                }

                if (!$scope.isValid($scope.survey.leased,false,true,0,150)) {
                    isSuccess = false;
                    error = 'Leased';
                    $('#leased').parent().addClass("has-error");
                }

                if (!$scope.isValid($scope.survey.renewal,false,true,0,150)) {
                    isSuccess = false;
                    error = 'Renewal';
                    $('#renewal').parent().addClass("has-error");
                }

                if (isSuccess) {

                    if (surveyid) {
                        $scope.success();
                        return;
                    }

                    $scope.fixConessions();

                    $('button.contact-submit').prop('disabled', true);
                    ngProgress.start();
                    $propertyService.getSurveyWarnings(id, $scope.survey).then(function(resp) {
                        $('button.contact-submit').prop('disabled', false);
                        ngProgress.complete();
                        if (resp.data.errors && resp.data.errors.length > 0) {
                            var errors = _.pluck(resp.data.errors,"msg").join("<li style='padding-top:5px'>")
                            $dialog.confirm('<span style="font-size:14px;font-weight: 500">Please double check  that the following item(s) are correct:</span><br><br><ul style="font-size: 15px; color: #f90 ;"><li>' + errors + '</ul>', function() {
                                $scope.success();
                            }, function() {});
                        }
                        else {
                            $scope.success();
                        }
                    }, function (err) {
                        $('button.contact-submit').prop('disabled', false);
                        toastr.error('Unable to perform action. Please contact an administrator');
                        ngProgress.complete();
                    })
                } else {
                    error = "Please update the highlighted required fields.<br><Br><b>- Blank or negative values are not valid.</b><br><b>- Rents/Concessions can not be decimal</b><Br><b>- Traffic or Leases can not be decimal</b><br><b>- Rents cannot be \"0\"</b>";
                    toastr.error(error);
                }
            }

            $scope.fixConessions = function() {
                if ($scope.settings.showDetailed) {
                    $scope.survey.floorplans.forEach(function (fp) {
                        delete fp.ner;
                        if (fp.concessionsOneTime != null && fp.concessionsMonthly != null
                            && !isNaN(fp.concessionsOneTime) && !isNaN(fp.concessionsMonthly)) {
                            fp.concessions = fp.concessionsOneTime + fp.concessionsMonthly * 12;
                        } else {
                            fp.concessions = 0;
                        }
                    })
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
                    if (surveyid) {
                        toastr.success('Market Survey Updated Successfully.');
                    }
                    else {
                        toastr.success('Market Survey Created Successfully.');
                    }

                    if (options && options.trackReminders === true) {
                        $auditService.create({type: 'tracking_reminder_survey', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name});
                    }
                    $uibModalInstance.close();
                }
            }

            $scope.success = function() {

                $scope.fixConessions();

                if (!$scope.settings.showDetailed) {
                    $scope.survey.floorplans.forEach(function (fp) {
                        delete fp.concessionsOneTime;
                        delete fp.concessionsMonthly;
                    });
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