angular.module('biradix.global').controller('marketSurveyController', ['$scope', '$uibModalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService','$dialog', 'surveyid', '$authService','$auditService','options','$userService','$propertyUsersService','$cookieSettingsService', function ($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService, $dialog, surveyid,$authService,$auditService, options,$userService,$propertyUsersService,$cookieSettingsService) {

            $scope.editableSurveyId = surveyid;
            $scope.settings = {showNotes : false, showDetailed: false};
            $scope.sort = "";

            if (!$rootScope.loggedIn) {
                return $location.path('/login')
            }

            ga('set', 'title', "/marketSurvey");
            ga('set', 'page', "/marketSurvey");
            ga('send', 'pageview');
            $scope.swap = {};

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
                        select: "_id name floorplans contactName contactEmail phone location_amenities community_amenities survey.id survey.date orgid"
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
                        $scope.survey.atr = $scope.survey.atr || '';
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
                                    $scope.survey.atr = s.atr;
                                    $scope.survey.atr_percent = s.atr_percent;
                                    $scope.survey.renewal = s.renewal;
                                    $scope.survey.occupancy = s.occupancy;
                                    $scope.survey.weeklytraffic = s.weeklytraffic
                                    $scope.survey.weeklyleases = s.weeklyleases
                                    $scope.survey.notes = s.notes;
                                    $scope.settings.showNotes = (s.notes || '') != '';

                                    var removeFloorplans = [];

                                    var bFloorplansChanged = false
                                    var old;
                                    $scope.survey.floorplans.forEach(function (fp, i) {
                                        old = _.find(s.floorplans, function (ofp) {
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


                                    // var removed = _.remove($scope.survey.floorplans, function(x) {return removeFloorplans.indexOf(x.id.toString()) > -1})

                                    var n;
                                    s.floorplans.forEach(function (fp) {
                                        n = _.find($scope.survey.floorplans, function (nfp) {
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
                        }
                        else {
                            $scope.doneLoading();
                        }
                    });
                }
            });

            $scope.getGuestInfo = function(guest) {
                var str = 'Last Email Sent: <b>';

                if (guest.lastEmailed) {
                    str += moment(guest.lastEmailed).format("MM/DD/YYYY")
                } else {
                    str += "Never"
                }

                str += "</b><Br>"

                str += 'Last Survey Completed: <b>';

                if (guest.lastCompleted) {
                    str += moment(guest.lastCompleted).format("MM/DD/YYYY")
                } else {
                    str += "Never"
                }

                str += "</b>"

                return str;
            }

            $scope.doneLoading = function() {
                $scope.survey.totalUnits = 0;

                $scope.survey.floorplans.forEach(function(fp) {
                    fp.concessionsOneTime = (fp.concessionsOneTime || fp.concessionsOneTime === 0) ?  fp.concessionsOneTime : '';
                    fp.concessionsMonthly = (fp.concessionsMonthly || fp.concessionsMonthly === 0) ?  fp.concessionsMonthly : '';

                    $scope.survey.totalUnits += fp.units;

                })

                $scope.survey.floorplans = _.sortByAll($scope.survey.floorplans, ['bedrooms', 'bathrooms',  'sqft', 'description', 'units', 'fid'])

                $scope.originalSurvey = _.cloneDeep($scope.survey);

                if (!$scope.editMode && !$scope.property.orgid && $rootScope.me.roles[0] != 'Guest') {
                    $propertyUsersService.getPropertyAssignedUsers($scope.property._id).then(function (response) {
                            $userService.search({ids:response.data.users, select: "first last email bounceReason guestStats"}).then(function (response) {
                                    $scope.swap.guests = response.data.users;
                                    if ($scope.swap.guests.length > 0) {

                                        $scope.swap.guests.forEach(function(u) {
                                            u.lastEmailed = null;
                                            u.lastCompleted = null;

                                            if (u.guestStats) {
                                                var stats = _.find(u.guestStats, function(x) {return x.propertyid == $scope.property._id.toString()})
                                                if (stats) {
                                                    u.lastEmailed = stats.lastEmailed;
                                                    u.lastCompleted = stats.lastCompleted;
                                                }
                                            }
                                        })

                                        $scope.swap.who = $cookieSettingsService.getSurveyGuestOption($scope.property._id);;
                                        $scope.swap.selectedGuest = $scope.swap.guests[0];
                                        $scope.showGuests();
                                    }
                                     else {
                                        $scope.showSurvey();
                                    }
                                },
                                function (error) {
                                    toastr.error("Unable to retrieve data. Please contact the administrator.");
                                    $scope.loading = false;
                                });

                        },
                        function (error) {
                            toastr.error("Unable to retrieve data. Please contact the administrator.");
                            $scope.loading = false;
                        });

                } else {
                    $scope.showSurvey();
                }

            }

            $scope.surveyWhoSelector = function() {
                if (!$scope.swap.who) {
                    toastr.error("Please select an option.");
                } else if ($scope.swap.who == 'manual') {
                    $cookieSettingsService.saveSurveyGuestOption($scope.property._id, 'manual');
                    $scope.showSurvey();
                } else {
                    $cookieSettingsService.saveSurveyGuestOption($scope.property._id, 'swap');
                    $('button.contact-submit').prop('disabled', true);
                    ngProgress.start();
                    $propertyService.emailGuest($scope.property._id, $scope.swap.selectedGuest._id).then(function(response) {
                        $('button.contact-submit').prop('disabled', false);
                        ngProgress.complete();
                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));

                        }
                        else {
                            toastr.success("Survey swap email sent to " + $scope.swap.selectedGuest.first + " " + $scope.swap.selectedGuest.last + " (" + $scope.swap.selectedGuest.email + ")")
                            $uibModalInstance.close();
                        }
                    }, function (err) {
                        $('button.contact-submit').prop('disabled', false);
                        toastr.error('Unable to perform action. Please contact an administrator');
                        ngProgress.complete();
                    })
                }
            }

            $scope.showGuests = function() {
                $scope.localLoading = true;
                $scope.showGuests = true;
            }

            $scope.showSurvey = function() {
                $scope.localLoading = true;
                $scope.showGuests = false;
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

                if (!allowDecimal && (field || '').toString().indexOf('.') > -1) {
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
                                        $('#leased').parent().addClass("has-error");
                                    }, 300);
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
                        case "atr":
                            $scope.atrWarning = false;
                            if (!state) {
                                $scope.survey.atr = $scope.originalSurvey.atr;
                                window.setTimeout(function() {
                                    $('#atr').parent().removeClass("has-error");
                                }, 300);
                            } else {
                                var er = "";

                                if (!$scope.isValid($scope.survey.atr, false, false, 0, $scope.survey.totalUnits)) {
                                    er = '<b>Warning:</b> Apartments to Rent value must be between 0 and total number of units and cannot be a decimal value';
                                }

                                if (er.length > 0) {
                                    toastr.warning(er);
                                    window.setTimeout(function() {
                                        $('#atr').parent().addClass("has-error");
                                    }, 300);
                                }

                                if ($scope.originalSurvey.atr_percent && $scope.originalSurvey.atr_percent > 0 && typeof $scope.survey.atr != 'undefined' && $scope.survey.atr != null ) {

                                    $scope.survey.atr_percent = Math.round($scope.survey.atr / $scope.survey.totalUnits * 100 * 10) / 10

                                    var percent = Math.abs((parseInt($scope.survey.atr_percent) - parseInt($scope.originalSurvey.atr_percent)));
                                    if (percent >= 10) {
                                        $scope.atrWarning = true;
                                    }
                                }

                            }
                            $scope.survey.atrupdated = $scope.survey.atr != $scope.originalSurvey.atr;;
                            break;
                        case "renewal":
                            $scope.renewalWarning = false;
                            if (!state) {
                                $scope.survey.renewal = $scope.originalSurvey.renewal;
                                window.setTimeout(function() {
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
                                        $('#renewal').parent().addClass("has-error");
                                    }, 300);
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
                                if (!$scope.isValid($scope.survey.occupancy,false,true,0,100)) {
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

                        if (isSuccess) {
                            fp.ner = fp.rent - (fp.concessionsOneTime || 0) / 12 - (fp.concessionsMonthly || 0);

                            if (fp.ner < 0) {
                                isSuccess = false;
                                error = 'concessions';
                                $('#concessionsMonthly-' + fp.id).parent().addClass("has-error");
                                $('#concessionsOneTime-' + fp.id).parent().addClass("has-error");
                                $('#rent-' + fp.id).parent().addClass("has-error");
                            }
                        }

                    } else {
                        if (!$scope.isValid(fp.concessions,true,false)) {
                            isSuccess = false;
                            error = 'concessions';
                            $('#concessions-' + fp.id).parent().addClass("has-error");
                        }

                        if (isSuccess) {
                            fp.ner = fp.rent - (fp.concessions || 0) / 12;

                            if (fp.ner < 0) {
                                isSuccess = false;
                                error = 'concessions';
                                $('#concessions-' + fp.id).parent().addClass("has-error");
                                $('#rent-' + fp.id).parent().addClass("has-error");
                            }
                        }


                    }

                })


                if (!$scope.isValid($scope.survey.occupancy,false,true,0,100)) {
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

                if (!$scope.isValid($scope.survey.atr,false,false, 0, $scope.survey.totalUnits)) {
                    isSuccess = false;
                    error = 'ATR';
                    $('#atr').parent().addClass("has-error");
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
                    error = "Please update the highlighted required fields.<br><Br><b>- Blank or negative values are not valid.</b><br><b>- Rents/Concessions can not be decimal</b><Br><b>- Traffic or Leases can not be decimal</b><br><b>- Rents cannot be \"0\"</b><br><b>- Net Effect Rent cannot be negative</b>";
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

            $scope.getOrder = function(sort) {
                switch (sort) {
                    case "type":
                        return ["bedrooms","bathrooms"]
                    case "-type":
                        return ["-bedrooms","bathrooms"]
                    default:
                        return sort;
                }
            }

            $scope.toggleSort = function(field, defaultAsc) {

                var ar = $scope.sort.split("-");
                var currentfield = "";
                var asc = false;

                if ($scope.sort != "") {
                    if (ar.length == 2) {
                        currentfield = ar[1];
                        asc = false;
                    } else {
                        currentfield = ar[0];
                        asc = true;
                    }
                }

                if (currentfield == field && asc != defaultAsc) {
                    $scope.sort = "";
                }
                else
                if (currentfield == field && asc) {
                    $scope.sort = "-" + field;
                }
                else
                if (currentfield == field && !asc) {
                    $scope.sort = field;
                }
                else
                if (defaultAsc) {
                    $scope.sort = field;
                } else {
                    $scope.sort = "-" + field;
                }

            }

    }]);


