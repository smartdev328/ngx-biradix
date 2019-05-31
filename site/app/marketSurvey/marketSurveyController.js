angular.module("biradix.global").controller("marketSurveyController", ["$scope", "$uibModalInstance", "id", "ngProgress", "$rootScope", "toastr", "$location", "$propertyService", "$dialog", "surveyid", "$authService", "$auditService", "options", "$userService", "$propertyUsersService", "$cookieSettingsService", "$keenService", "$marketSurveyService", "$marketSurveyPMSService",
    function($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService, $dialog, surveyid, $authService, $auditService, options, $userService, $propertyUsersService, $cookieSettingsService, $keenService, $marketSurveyService, $marketSurveyPMSService) {
            $scope.surveyid = surveyid;
            $scope.settings = {showNotes: false, showBulkConcessions: false, showDetailed: false, showLeases: false, showRenewal: false, showATR: false, newVersion: true };
            $scope.sort = "";

            if (!$rootScope.loggedIn) {
                return $location.path("/login");
            }

            if($cookieSettingsService.getNewVersion()) {
                $scope.settings.newVersion = true;
            }

            ga("set", "title", "/marketSurvey");
            ga("set", "page", "/marketSurvey");
            ga("send", "pageview");

        $marketSurveyPMSService.registerPMSFunctions($scope);

            $scope.swap = {};

            $scope.cancel = function () {
                if ($scope.changed) {
                    $dialog.confirm("You have made changes that have not been saved. Are you sure you want to close without saving?", function () {
                        $uibModalInstance.dismiss("cancel");
                    }, function () {
                    });
                }
                else {
                    $uibModalInstance.dismiss("cancel");
                }
            };

            $scope.changed = false;

            $scope.updateChanged = function() {
                $scope.changed = true;
            };

            $scope.pressed = function(row, id, event) {
                // Tab
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
                        if (typeof fp.concessionsOneTime != "undefined" && fp.concessionsOneTime != null && fp.concessionsOneTime !== "" && !isNaN(fp.concessionsOneTime)
                            && typeof fp.concessionsMonthly != "undefined" && fp.concessionsMonthly != null && fp.concessionsMonthly !== "" && !isNaN(fp.concessionsMonthly)
                            ) {
                            fp.concessions = fp.concessionsOneTime + fp.concessionsMonthly * 12;
                        }
                    });
                    $scope.settings.showBulkConcessions = false;
                }

                $scope.survey.floorplans.forEach(function(fp) {
                    delete fp.errors;
                    delete fp.warnings;
                });
            }

            $scope.toggleBulkConcessions = function() {
                if(!$scope.settings.showDetailed) {
                    $scope.settings.showBulkConcessions = false;
                }
            }

            $scope.toggleNewView = function() {
                $scope.settings.newVersion = !$scope.settings.newVersion;
                $cookieSettingsService.saveNewVersion($scope.settings.newVersion);
            }

            var me = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    $scope.settings.showLeases = $rootScope.me.settings.showLeases;
                    $scope.settings.showRenewal = $rootScope.me.settings.showRenewal;
                    $scope.settings.showATR = $rootScope.me.settings.showATR;

                    me();
                    $scope.settings.showDetailed = $rootScope.me.settings.monthlyConcessions;

                    // Call survey get property
                    $marketSurveyService.getPropertyWithSurvey(id, $scope.surveyid, $scope.settings, function(response) {
                        for (var key in response) {
                           $scope[key] = response[key];
                        }
                        if(response.property.floorplans.length > 8) {
                            $scope.allShown = false;
                        } else {
                            $scope.allShown = true;
                        }

                        if(($scope.settings.showLeases && !$scope.settings.showRenewal && !$scope.settings.showATR) || 
                        (!$scope.settings.showLeases && $scope.settings.showRenewal && !$scope.settings.showATR) || 
                        (!$scope.settings.showLeases && !$scope.settings.showRenewal && !$scope.settings.showATR)) {
                            $scope.threeColumnsInput = false;
                        } else {
                            $scope.threeColumnsInput = true;
                        }

                        $scope.doneLoading();
                    });

                    if (!$scope.settings.showDetailed) {
                        $scope.settings.showBulkConcessions = false;
                    }

                }
            });

            $scope.guestResponded = function() {
                if ($rootScope.me.roles[0] == "Guest") {
                    var request = _.find($rootScope.me.guestStats, function(x) {
                       return x.propertyid.toString() === $scope.property._id.toString();
                    });

                    if (request) {
                        var event = {
                            type: "SurveySwap Responded",
                            payload: {
                                property: {
                                    id: $scope.property._id,
                                    name: $scope.property.name,
                                },
                                responseTimeInMinutes: Math.round(((new Date()).getTime() - (new Date(request.lastEmailed)).getTime()) / 1000 / 60),
                                user: {
                                    id: request.sender && request.sender.id ? request.sender.id : "",
                                    name: request.sender ? request.sender.first + " " + request.sender.last : "",
                                    organization: {
                                        id: request.sender && request.sender.organization ? request.sender.organization.id : "",
                                        name: request.sender && request.sender.organization ? request.sender.organization.name : "N/A",
                                    },
                                },
                                survery_swap_contact: {
                                    name: $rootScope.me.first + " " + $rootScope.me.last,
                                    email: $rootScope.me.email,
                                    domain: ($rootScope.me.email || "").replace(/.*@/, ""),
                                },
                            },
                        };
                        $keenService.record(event).then(function(response) {}, function(error) {});
                    }
                }
            };

            $scope.getGuestInfo = function(guest) {
                var str = "Last Email Sent: <b>";

                if (guest.lastEmailed) {
                    str += moment(guest.lastEmailed).format("MM/DD/YYYY");
                } else {
                    str += "Never";
                }

                str += "</b><Br>";

                str += "Last Survey Completed: <b>";

                if (guest.lastCompleted) {
                    str += moment(guest.lastCompleted).format("MM/DD/YYYY");
                } else {
                    str += "Never";
                }

                str += "</b>";

                return str;
            };

    $scope.getGuestInfoBounce = function(guest) {
        var str = "<B>Last Email Sent:</B> ";

        if (guest.lastEmailed) {
            str += moment(guest.lastEmailed).format("MM/DD/YYYY");
        } else {
            str += "Never";
        }

        str += "<Br>";

        str += "<B>Last Survey Completed: </b>";

        if (guest.lastCompleted) {
            str += moment(guest.lastCompleted).format("MM/DD/YYYY");
        } else {
            str += "Never";
        }

        str += "<br>";

        str += "<b>Status:</b> Undeliverable<br>";

        str += "<b>Email:</b> " + guest.email + "<br>";

        str += "<B>Error:</B> " + guest.bounceReason + "<br>"

        if (guest.bounceDate) {
            str += "<B>Last Attempt:</B> " + moment(new Date(guest.bounceDate)).format("MM/DD/YYYY HH:MM") + "<br>"
        }
        return str;
    }

        $scope.totalRent = function() {
            $scope.totals.rent = 0;
            $scope.survey.floorplans.forEach(function(fp) {
                if(fp.rent){
                    $scope.totals.rent += (fp.rent * fp.units);
                }
            });

            if ($scope.totals.units) {
                $scope.totals.rent /= $scope.totals.units;
            }

            return $scope.totals.rent;
        };

        $scope.totalConcessions = function() {
            $scope.totals.concessions = 0;
            $scope.survey.floorplans.forEach(function(fp) {
                $scope.totals.concessions += (fp.concessions * fp.units);
            });

            if ($scope.totals.units) {
                $scope.totals.concessions /= $scope.totals.units;
            }

            return $scope.totals.concessions;
        };

    $scope.totalConcessionsOneTime = function() {
        $scope.totals.concessionsOneTime = 0;
        $scope.survey.floorplans.forEach(function(fp) {
            $scope.totals.concessionsOneTime += (fp.concessionsOneTime * fp.units);
        });

        if ($scope.totals.units) {
            $scope.totals.concessionsOneTime /= $scope.totals.units;
        }

        return $scope.totals.concessionsOneTime;
    };

    $scope.totalConcessionsMonthly = function() {
        $scope.totals.concessionMonthly = 0;
        $scope.survey.floorplans.forEach(function(fp) {
            if(fp.concessionsMonthly){
                $scope.totals.concessionsMonthly += (fp.concessionsMonthly * fp.units);
            } else {
                $scope.getErrors(fp);
            }
        });

        if ($scope.totals.units) {
            $scope.totals.concessionsMonthly /= $scope.totals.units;
        }

        return $scope.totals.concessionsMonthly;
    };

            $scope.doneLoading = function() {
                if (!$scope.property.orgid && $rootScope.me.roles[0] !== "Guest") {
                    $propertyUsersService.getPropertyAssignedUsers($scope.property._id).then(function (response) {
                            $userService.search({ids: response.data.users, select: "first last email bounceReason bounceDate guestStats"}).then(function (response) {
                                    $scope.swap.guests = response.data.users;
                                    if ($scope.swap.guests.length > 0) {

                                        $scope.swap.guests.forEach(function(u) {
                                            u.lastEmailed = null;
                                            u.lastCompleted = null;

                                            if (u.guestStats) {
                                                var stats = _.find(u.guestStats, function(x) {
                                                    return x.propertyid == $scope.property._id.toString();
                                                });
                                                if (stats) {
                                                    u.lastEmailed = stats.lastEmailed;
                                                    u.lastCompleted = stats.lastCompleted;
                                                }
                                            }
                                        })

                                        $scope.swap.who = $cookieSettingsService.getSurveyGuestOption($scope.property._id);
                                        $scope.swap.selectedGuest = $scope.swap.guests[0];
                                        $scope.showGuests();
                                    } else {
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
            };

            $scope.surveyWhoSelector = function() {
                if (!$scope.swap.who) {
                    toastr.error("Please select an option.");
                } else if ($scope.swap.who === "manual") {
                    $cookieSettingsService.saveSurveyGuestOption($scope.property._id, 'manual');
                    $scope.showSurvey();
                } else {
                    var event = {
                        type: "SurveySwap Requested",
                        payload: {
                            property: {
                                id: $scope.property._id,
                                name: $scope.property.name,
                            },
                            user: {
                                id: $rootScope.me._id,
                                name: $rootScope.me.first + " " + $rootScope.me.last,
                                organization: {
                                    id: $rootScope.me.orgs[0]._id,
                                    name: $rootScope.me.orgs[0].name,
                                },
                            },
                            survery_swap_contact: {
                                name: $scope.swap.selectedGuest.first + " " + $scope.swap.selectedGuest.last,
                                email: $scope.swap.selectedGuest.email,
                                domain: ($scope.swap.selectedGuest.email || "").replace(/.*@/, ""),
                            },
                        },
                    };

                    $cookieSettingsService.saveSurveyGuestOption($scope.property._id, 'swap');
                    $("button.contact-submit").prop('disabled', true);
                    ngProgress.start();
                    $propertyService.emailGuest($scope.property._id, $scope.swap.selectedGuest._id, (options || {}).subjectid, (options || {}).subjectname).then(function(response) {
                        $("button.contact-submit").prop('disabled', false);
                        ngProgress.complete();
                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                        } else {
                            $keenService.record(event).then(function(response) {}, function(error) {});
                            toastr.success("SurveySwap email sent to " + $scope.swap.selectedGuest.first + " " + $scope.swap.selectedGuest.last + " (" + $scope.swap.selectedGuest.email + ")")
                            $uibModalInstance.close();
                        }
                    }, function (err) {
                        $("button.contact-submit").prop('disabled', false);
                        rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                        toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
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

                // Don't focus on fields in survey if we are PMSing
                if ($scope.pms) {
                    return;
                }

                window.setTimeout(function() {
                    var first = $(".survey-values").find("input")[0];
                    first.focus();
                    first.select();
                }, 300);
            }

            $scope.isValid = function(field, required, allowDecimal, min, max) {
                if (typeof field === "undefined") {
                    return false;
                }

                if (required) {
                    if (field === "" || field === null || isNaN(field)) {
                        return false;
                    }
                } else {
                    if (field !== "" && field !== null && isNaN(field)) {
                        return false;
                    }
                }

                if (!allowDecimal && (field || "").toString().indexOf('.') > -1) {
                    return false;
                }

                if (field !== "" && field != null && !isNaN(field)) {
                    if (typeof min !== "undefined" && parseFloat(field) < min) {
                        return false;
                    }
                    if (typeof max !== "undefined" && parseFloat(field) > max) {
                        return false;
                    }
                }

                return true;
            }

            $scope.updateDone = function(fp, state, fpField) {
                fpField = fpField || "";

                if (typeof fp == "string") {
                    switch (fp) {
                        case "leased":
                            $scope.validation = $scope.validation || {};
                            $scope.validation.leased = $scope.validation.leased || {};
                            $scope.validation.leased.warnings = $scope.validation.leased.warnings || {};
                            $scope.validation.leased.errors = $scope.validation.leased.errors || {};

                            if (!state) {
                                $scope.validation.leased.warnings = {};
                                $scope.validation.leased.errors = {};
                                $scope.survey.leased = $scope.originalSurvey.leased;
                            } else {
                                var er = "";

                                if (!$scope.isValid($scope.survey.leased, false, true, 0, 150)) {
                                    er = "Leased must be between 0% and 150%";
                                }

                                if (!er) {
                                    if ($scope.originalSurvey && typeof $scope.originalSurvey.leased !== "undefined" && $scope.originalSurvey.leased >= 20 && parseInt($scope.survey.leased) === 0) {
                                        er = "Properties that have been above 20% leased historically cannot be set to 0. If you don't know leased %, leave it blank";
                                    }
                                }

                                $scope.validation.leased.warnings = {};
                                $scope.validation.leased.errors = {};
                                $scope.validation.leased.errors.zero = er;

                                $scope.validation.leased.warnings.change = "";

                                if ($scope.originalSurvey && typeof $scope.originalSurvey.leased !== "undefined" && $scope.originalSurvey.leased !== "" && $scope.originalSurvey.leased >= 0 && $scope.survey.leased) {
                                    var percent = 100;

                                    if ($scope.originalSurvey.leased > 0) {
                                        percent = Math.abs((parseInt($scope.survey.leased) - parseInt($scope.originalSurvey.leased)) / parseInt($scope.originalSurvey.leased) * 100);
                                    }

                                    if (percent >= 10) {
                                        $scope.leasedWarning = true;
                                        $scope.validation.leased.warnings.change = "Leased % has changed by more than 10% since the last Property Survey";
                                    }
                                }
                            }
                            $scope.survey.leasedupdated = $scope.survey.leased != $scope.originalSurvey.leased;
                            break;
                        case "atr":
                            $scope.validation = $scope.validation || {};
                            $scope.validation.atr = $scope.validation.atr || {};
                            $scope.validation.atr.warnings = $scope.validation.atr.warnings || {};
                            $scope.validation.atr.errors = $scope.validation.atr.errors || {};

                            if (!state) {
                                $scope.validation.atr.warnings = {};
                                $scope.validation.atr.errors = {};
                                $scope.survey.atr = $scope.originalSurvey.atr;
                            } else {
                                var er = "";

                                if (!$scope.isValid($scope.survey.atr, false, false, 0, $scope.survey.totalUnits)) {
                                    er = "Apartments to Rent value must be between 0 and total number of units and cannot be a decimal value";
                                }

                                $scope.validation.atr.warnings = {};
                                $scope.validation.atr.errors = {};
                                $scope.validation.atr.errors.zero = er;

                                $scope.validation.atr.warnings.change = "";
                                $scope.survey.atr_percent = Math.round($scope.survey.atr / $scope.survey.totalUnits * 100 * 10) / 10

                                if ($scope.originalSurvey.atr_percent && $scope.originalSurvey.atr_percent > 0 && typeof $scope.survey.atr != "undefined" && $scope.survey.atr != null) {
                                    var percent = Math.abs((parseInt($scope.survey.atr_percent) - parseInt($scope.originalSurvey.atr_percent)));
                                    if (percent >= 10) {
                                        $scope.validation.atr.warnings.change = "ATR % has changed by more than 10% since the last Property Survey";
                                    }
                                }
                            }
                            $scope.survey.atrupdated = $scope.survey.atr != $scope.originalSurvey.atr;
                            break;
                        case "renewal":
                            $scope.validation = $scope.validation || {};
                            $scope.validation.renewal = $scope.validation.renewal || {};
                            $scope.validation.renewal.warnings = $scope.validation.renewal.warnings || {};
                            $scope.validation.renewal.errors = $scope.validation.renewal.errors || {};

                            if (!state) {
                                $scope.validation.renewal.warnings = {};
                                $scope.validation.renewal.errors = {};
                                $scope.survey.renewal = $scope.originalSurvey.renewal;
                            } else {
                                var er = "";

                                if (!$scope.isValid($scope.survey.renewal, false, true, 0, 150)) {
                                    er = "Renewal must be between 0% and 150%";
                                }

                                $scope.validation.renewal.warnings = {};
                                $scope.validation.renewal.errors = {};
                                $scope.validation.renewal.errors.zero = er;

                                $scope.validation.renewal.warnings.change = "";
                                if ($scope.originalSurvey.renewal && $scope.originalSurvey.renewal > 0 && $scope.survey.renewal) {
                                    var percent = Math.abs((parseInt($scope.survey.renewal) - parseInt($scope.originalSurvey.renewal)) / parseInt($scope.originalSurvey.renewal) * 100);
                                    if (percent >= 10) {
                                        $scope.validation.renewal.warnings.change = "Renewal % has changed by more than 10% since the last Property Survey";
                                    }
                                }
                            }
                            $scope.survey.renewalupdated = $scope.survey.renewal != $scope.originalSurvey.renewal;
                            break;
                        case "occupancy":
                            $scope.validation = $scope.validation || {};
                            $scope.validation.occupancy = $scope.validation.occupancy || {};
                            $scope.validation.occupancy.warnings = $scope.validation.occupancy.warnings || {};
                            $scope.validation.occupancy.errors = $scope.validation.occupancy.errors || {};

                            if (!state) {
                                $scope.validation.occupancy.warnings = {};
                                $scope.validation.occupancy.errors = {};

                                $scope.survey.occupancy = $scope.originalSurvey.occupancy;
                            } else {
                                var er = "";
                                if (!$scope.isValid($scope.survey.occupancy, false, true, 0, 100)) {
                                    er = "Occupancy must be between 0% and 100%";
                                }

                                if (!er) {
                                    if ($scope.originalSurvey && typeof $scope.originalSurvey.occupancy !== "undefined" && $scope.originalSurvey.occupancy >= 20 && parseInt($scope.survey.occupancy) === 0) {
                                        er = "Properties that have been above 20% occupancy historically cannot be set to 0. If you don't know occupancy %, leave it blank";
                                    }
                                }

                                $scope.validation.occupancy.warnings = {};
                                $scope.validation.occupancy.errors = {};
                                $scope.validation.occupancy.errors.zero = er;

                                $scope.validation.occupancy.warnings.change = "";

                                if ($scope.originalSurvey && typeof $scope.originalSurvey.occupancy !== "undefined" && $scope.originalSurvey.occupancy >= 0) {
                                    var percent = 100;

                                    if (percent > 0) {
                                        percent = Math.abs((parseInt($scope.survey.occupancy) - parseInt($scope.originalSurvey.occupancy)) / parseInt($scope.originalSurvey.occupancy) * 100);
                                    }

                                    if (percent >= 10) {
                                        $scope.validation.occupancy.warnings.change = "Occupancy % has changed by more than 10% since the last Property Survey";
                                    }
                                }
                            }
                            $scope.survey.occupancyupdated = $scope.survey.occupancy != $scope.originalSurvey.occupancy;
                            break;
                        case "traffic":
                            $scope.validation = $scope.validation || {};
                            $scope.validation.traffic = $scope.validation.traffic || {};
                            $scope.validation.traffic.warnings = $scope.validation.traffic.warnings || {};
                            $scope.validation.traffic.errors = $scope.validation.traffic.errors || {};

                            if (!state) {
                                $scope.validation.traffic.warnings = {};
                                $scope.validation.traffic.errors = {};
                                $scope.survey.weeklytraffic = $scope.originalSurvey.weeklytraffic;
                            } else {
                                var er = "";

                                if (!$scope.isValid($scope.survey.weeklytraffic, true, false)) {
                                    er = "Traffic/Week must be 0 or greater, no decimals";
                                }

                                $scope.validation.traffic.errors.zero = er;
                            }

                            $scope.survey.trafficupdated = $scope.survey.weeklytraffic != $scope.originalSurvey.weeklytraffic;
                            break;
                        case "leases":
                            $scope.validation = $scope.validation || {};
                            $scope.validation.leases = $scope.validationleases || {};
                            $scope.validation.leases.warnings = $scope.validation.leases.warnings || {};
                            $scope.validation.leases.errors = $scope.validation.leases.errors || {};
                            if (!state) {
                                $scope.validation.leases.warnings = {};
                                $scope.validation.leases.errors = {};
                                $scope.survey.weeklyleases = $scope.originalSurvey.weeklyleases;
                            } else {
                                var er = "";
                                if (!$scope.isValid($scope.survey.weeklyleases, true, false)) {
                                    er = "Leases/Week must be 0 or greater, no decimals";
                                }

                                $scope.validation.leases.errors.zero = er;
                            }

                            $scope.survey.leasesupdated = $scope.survey.weeklyleases != $scope.originalSurvey.weeklyleases;
                            break;
                    }
                } else {
                    var old = _.find($scope.originalSurvey.floorplans, function(o) {
                        return o.id == fp.id;
                    });

                    if (old && old.rent) {
                        old.ner = old.rent - old.concessions / 12;
                    }

                    if (!state) {
                        fp.rent = old.rent;
                        fp.concessions = old.concessions;
                        fp.concessionsMonthly = old.concessionsMonthly;
                        fp.concessionsOneTime = old.concessionsOneTime;
                        fp.warnings = {};
                        fp.errors = {};
                    } else {
                        var er = "";
                        fp.errors = fp.errors || {};
                        fp.warnings = fp.warnings || {};

                        if (fpField == "rent") {
                            if (!$scope.isValid(fp.rent, true, false, 1, 100000)) {
                                er = "Rent must be 1 or greater, no decimals or blank fields";
                            }

                            fp.errors.rent = er;

                            if (er.length > 0) {
                                $scope.checkUndoFp(fp, old);
                                return;
                            }
                        }

                        if ($scope.settings.showDetailed) {
                            if (fpField == "concessionsOneTime") {
                                if (!$scope.isValid(fp.concessionsOneTime, true, false)) {
                                    er = "Concessions (One-Time) must be 0 or greater, no decimals or blank fields";
                                }

                                fp.errors.concessionsOneTime = er;
                                if (er.length > 0) {
                                    $scope.checkUndoFp(fp, old);
                                    return;
                                }
                            }

                            if (fpField == "concessionsMonthly") {
                                if (!$scope.isValid(fp.concessionsMonthly, true, false)) {
                                    er = "Concessions (Monthly) must be 0 or greater, no decimals or blank fields";
                                }

                                fp.errors.concessionsMonthly = er;

                                if (er.length > 0) {
                                    $scope.checkUndoFp(fp, old);
                                    return;
                                }
                            }
                        } else {
                            if (fpField == "concessions") {
                                if (!$scope.isValid(fp.concessions, true, false)) {
                                    er = "Concessions must be 0 or greater, no decimals or blank fields";
                                }

                                fp.errors.concessions = er;

                                if (er.length > 0) {
                                    $scope.checkUndoFp(fp, old);
                                    return;
                                }
                            }
                        }

                        if ($scope.settings.showDetailed) {
                            fp.ner = fp.rent - (fp.concessionsOneTime || 0) / 12 - (fp.concessionsMonthly || 0);
                        } else {
                            fp.ner = fp.rent - (fp.concessions || 0) / 12;
                        }

                        fp.errors.ner = "";
                        if (fp.ner < 0) {
                            fp.errors.ner = "The NER for a floor plan cannot be negative";
                            $scope.checkUndoFp(fp, old);
                            return;
                        }

                        delete fp.warnings.ner;

                        if (old.rent > 0) {
                            if ($scope.settings.showDetailed) {
                                if (fp.concessionsOneTime === null || typeof fp.concessionsOneTime == "undefined" || fp.concessionsOneTime === ""
                                    || fp.concessionsMonthly === null || typeof fp.concessionsMonthly == "undefined" || fp.concessionsMonthly === ""
                                ) {
                                    fp.ner = old.ner;
                                }
                            } else {
                                if (fp.concessions === null || typeof fp.concessions == "undefined" || fp.concessions === "" ) {
                                    fp.ner = old.ner;
                                }
                            }

                            var percent = Math.abs((parseInt(fp.ner) - parseInt(old.ner)) / parseInt(old.ner) * 100);

                            if (percent >= 10) {
                                fp.warnings.ner = "The NER for this floor plan has changed by more than 10% since the last property survey";
                            }
                        }
                    }
                    $scope.checkUndoFp(fp, old);
                }
            };

    $scope.getWarnings = function(fp) {
        var er = "";

        if (fp && fp.warnings) {
            for (var e in fp.warnings) {
                if (fp.warnings[e]) {
                    er += "<li><Span>" + fp.warnings[e] + "</Span><Br>";
                }
            }
        }

        if (er) {
            er = "<UL class='warn'>" + er + "</UL>";
        }

        return er;
    };

    $scope.getErrors = function(fp) {
        var er = "";

        if (fp && fp.errors) {
            for (var e in fp.errors) {
                if (fp.errors[e]) {
                    er += "<li><Span>" + fp.errors[e] + "</Span><Br>";
                }
            }
        }

        if (er) {
            er = "<UL>" + er + "</UL>";
        }

        return er;
    };

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
                var all = $(".survey-values input[type='number']");

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
            }

            $scope.create = function() {
                var isSuccess = true;
                var error = "";

                $scope.survey.floorplans.forEach(function(fp) {
                    $scope.updateDone(fp, true, "rent");

                    if ($scope.settings.showDetailed) {
                        $scope.updateDone(fp, true, "concessionsOneTime");
                        $scope.updateDone(fp, true, "concessionsMonthly");
                    } else {
                        $scope.updateDone(fp, true, "concessions");
                    }

                    if ($scope.getErrors(fp)) {
                        isSuccess = false;
                    }
                });

                $scope.updateDone("occupancy", true);
                if ($scope.getErrors($scope.validation.occupancy)) {
                    isSuccess = false;
                }

                $scope.updateDone("leased", true);
                if ($scope.getErrors($scope.validation.leased)) {
                    isSuccess = false;
                }

                $scope.updateDone("renewal", true);
                if ($scope.getErrors($scope.validation.renewal)) {
                    isSuccess = false;
                }

                $scope.updateDone("atr", true);
                if ($scope.getErrors($scope.validation.atr)) {
                    isSuccess = false;
                }

                $scope.updateDone("traffic", true);
                if ($scope.getErrors($scope.validation.traffic)) {
                    isSuccess = false;
                }

                $scope.updateDone("leases", true);
                if ($scope.getErrors($scope.validation.leases)) {
                    isSuccess = false;
                }
                if (isSuccess) {
                    if ($scope.surveyid) {
                        $scope.success();
                        return;
                    }

                    $scope.fixConessions();

                    $("button.contact-submit").prop('disabled', true);
                    ngProgress.start();

                    $propertyService.getSurveyWarnings(id, $scope.survey).then(function(resp) {
                        $("button.contact-submit").prop('disabled', false);
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
                        $("button.contact-submit").prop('disabled', false);
                        rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                        toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                        ngProgress.complete();
                    });
                } else {
                    error = "Please update the highlighted fields.";
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
                $("button.contact-submit").prop('disabled', false);
                rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                ngProgress.complete();
            };

            var surveySuccess = function(resp) {
                $("button.contact-submit").prop('disabled', false);
                ngProgress.complete();
                if (resp.data.errors && resp.data.errors.length > 0) {
                    var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                    toastr.error(errors);
                }
                else {
                    $scope.guestResponded();
                    $rootScope.$broadcast('data.reload');
                    if ($scope.surveyid) {
                        toastr.success('Property Survey updated successfully.');
                    } else {
                        toastr.success('Property Survey created successfully.');
                    }

                    if (options && options.trackReminders === true) {
                        $auditService.create({type: 'tracking_reminder_survey', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name});
                    }
                    $uibModalInstance.close();
                }
            }

            $scope.success = function() {
                $scope.fixConessions();

                $scope.survey.floorplans.forEach(function (fp) {
                    if (!$scope.settings.showDetailed) {
                        delete fp.concessionsOneTime;
                        delete fp.concessionsMonthly;
                    }
                    delete fp.errors;
                    delete fp.warnings;
                    delete fp.updated;
                });

                $("button.contact-submit").prop("disabled", true);
                ngProgress.start();

                if ($scope.pms) {
                    $scope.survey.pms = {
                        date: $scope.pms.dates.date,
                        provider: "YARDI",
                        id: $scope.pms.id
                    };
                }

                var diff = [];

                if ($scope.pms) {
                   diff = $marketSurveyPMSService.getYardiDiff($scope);
                   if (diff.length) {
                       diff.unshift({separator: true});
                   }
                }

                if ($scope.surveyid) {
                    $propertyService.updateSurvey(id, $scope.surveyid, $scope.survey, diff).then(surveySuccess, surveyError);
                } else {
                    $propertyService.createSurvey(id, $scope.survey, diff).then(surveySuccess, surveyError);
                }
            };

            $scope.getOrder = function(sort) {
                switch (sort) {
                    case "type":
                        return ["bedrooms", "bathrooms", "sqft", "description", "units"];
                    case "-type":
                        return ["-bedrooms", "bathrooms", "sqft", "description", "units"];
                    default:
                        return [sort, "bedrooms", "bathrooms", "sqft", "description", "units"];
                }
            };

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
            };

            $scope.delete = function() {
                $("button.contact-submit").prop("disabled", true);

                $dialog.confirm("Are you sure you want to delete this Property Survey?", function() {
                    $propertyService.deleteSurvey(id, $scope.surveyid).then(function(response) {
                            $("button.contact-submit").prop("disabled", false);
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, "msg").join("<br>"));
                            } else {
                                $rootScope.$broadcast("data.reload");
                                toastr.success("Property Survey deleted successfully.");
                                $uibModalInstance.close();
                            }
                        },
                        function(error) {
                            $("button.contact-submit").prop("disabled", false);
                            toastr.error("Unable to delete Property Survey. Please contact the administrator.");
                        });
                }, function() {
                    $("button.contact-submit").prop("disabled", false);
                });
            };

            $scope.showDate = function(date) {
              if (!date) {
                  return "Never";
              } else {
                  return moment(date).fromNow();
              }
            };

        $scope.showDateHover = function(date) {
            if (!date) {
                return "Never";
            } else {
                return moment(date).format("MM/DD/YYYY h:mm a");
            }
        };


        $scope.bulkConcession = {
            "checkall" : false,
            "concessionsTimes" : "One-time",
            "concessionValue" : "",
            "leasedLength" : 12,
            "concessionsTypeOff" : "dollars off",
            "SelectedFloorPlan" : {},
            "applyError": "",
            "checkboxError": false
        }

        $scope.bulkConcession.toggleAll = function() {
            $scope.survey.floorplans.forEach(function(f) {
                $scope.bulkConcession.SelectedFloorPlan[f.id] = $scope.bulkConcession.checkall;
            });
            $scope.bulkConcession.checkboxError = false;
        }

        $scope.bulkConcession.toggleSingle = function() {
            $scope.bulkConcession.checkall = false;
            if(_.size($scope.bulkConcession.SelectedFloorPlan) === $scope.survey.floorplans.length) {
                $scope.bulkConcession.checkall = _.every($scope.bulkConcession.SelectedFloorPlan, function(i) {
                    return i === true;
                });
            }
            $scope.bulkConcession.checkboxError = false;
        }

        $scope.bulkConcession.applyButton = function() {

            if(!$scope.bulkConcession.concessionValue) {
                $scope.bulkConcession.applyError = "Please type a concession value.";
                return;
            }

            var selectedFPId = [];
            for (var fp in $scope.bulkConcession.SelectedFloorPlan) {
                if($scope.bulkConcession.SelectedFloorPlan[fp]) {
                    selectedFPId.push(fp);
                }
            }

            var filteredList = _.filter($scope.survey.floorplans, function(fp) { 
                if(selectedFPId.includes(fp.id)) {
                    return fp;
                }
            });

            if(!filteredList.length) {
                $scope.bulkConcession.applyError = "Use the checkboxes to select the floor plans that you want to apply concessions to.";
                $scope.bulkConcession.checkboxError = true;
                return;
            }

            filteredList.forEach(function(item) {

                $scope.checkUndoFp(item, item.concessions);
                $scope.getErrors(item);
                $scope.getWarnings(item);

                switch ($scope.bulkConcession.concessionsTypeOff) {
                    case "dollars off":
                        if($scope.bulkConcession.concessionsTimes == "One-time") {
                            item.concessionsOneTime = parseInt($scope.bulkConcession.concessionValue);
                        } else {
                            item.concessionsMonthly = parseInt($scope.bulkConcession.concessionValue);
                        }
                        break;
                    case "week(s) free":
                        if($scope.bulkConcession.concessionsTimes == "One-time") {
                            item.concessionsOneTime = Math.round((parseInt($scope.bulkConcession.concessionValue)/4 * item.rent)/parseInt($scope.bulkConcession.leasedLength) * 12);
                        } else {
                            item.concessionsMonthly = Math.round((parseInt($scope.bulkConcession.concessionValue)/4 * item.rent)/parseInt($scope.bulkConcession.leasedLength));
                        }
                        break;
                    case "month(s) free":
                        if($scope.bulkConcession.concessionsTimes == "One-time") {
                            item.concessionsOneTime = Math.round((parseInt($scope.bulkConcession.concessionValue) * item.rent)/parseInt($scope.bulkConcession.leasedLength) * 12);
                        } else {
                            item.concessionsMonthly = Math.round((parseInt($scope.bulkConcession.concessionValue) * item.rent)/parseInt($scope.bulkConcession.leasedLength));
                        }
                        break;
                }

            });

            $scope.bulkConcession.applyError = "";
            $scope.bulkConcession.checkboxError = false;
        
        }

        $scope.showAllFP = function() {
            $scope.allShown = !$scope.allShown;
        }

    }]);
