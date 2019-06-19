'use strict';
define([
    'app',
    '../../services/exportService',
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', '$window','$cookies', 'ngProgress', '$progressService', '$cookieSettingsService', '$auditService','$exportService','toastr', '$reportingService','$urlService', '$saveReportService', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams, $window, $cookies, ngProgress, $progressService, $cookieSettingsService, $auditService,$exportService,toastr,$reportingService,$urlService,$saveReportService) {
        $rootScope.nav = ''
        $rootScope.sideMenu = false;
        $scope.excludedPopups = {};

        $scope.propertyId = $stateParams.id;
        $scope.r = Math.round(Math.random()*1);

       $scope.defaultShow = function() {
            $scope.settings.show = $reportingService.getDefaultProfileFloorplanColumns($(window).width());
        }

        $scope.reset = function() {
            $scope.defaultShow();
            $cookies.remove('fp.s');
            $scope.settings.orderByFp = "sqft";
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('fp.o', $scope.settings.orderByFp, {expires : expireDate})
        }

        /**********************************************/
        $scope.defaultShowProfile = function() {
            $scope.showProfile = $reportingService.getDefaultInfoRows($rootScope.me);

        }

        $scope.timezone = moment().utcOffset();
        if ($cookies.get("timezone")) {
            $scope.timezone = parseInt($cookies.get("timezone"));
        }

        // make sure me is loaded befor you search initially
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();
                $scope.settings = $reportingService.getProfileSettings($(window).width());
                $scope.showProfile = $reportingService.getInfoRows($rootScope.me);

                $scope.localLoading = false;
                $propertyService.getSubjectPerspectives($scope.propertyId).then(function (response) {
                    $scope.settings.perspectives = [{value: "", text: "All Data", propertyId: ""}];

                    response.data.properties.forEach(function(p) {
                        p.perspectives.forEach(function(pr) {
                            $scope.settings.perspectives.push({value: pr.id, text: pr.name, group: p.name, propertyId: p._id.toString()});
                        });
                    });

                    $scope.settings.perspectives.push({value: "-1", text: " + Add/Edit Perspective"});

                    $scope.settings.perspective = _.find($scope.settings.perspectives, function(x) {
                        return x.value.toString() === $scope.settings.selectedPerspective.toString();
                    });

                    if (!$scope.settings.perspective) {
                        $scope.settings.perspective = $scope.settings.perspectives[0];
                    }

                    $scope.loadProperty($scope.propertyId);
                }, function(err) {
                    $scope.apiError = true;
                });
            }
        });


        $scope.$watch('settings.perspective', function() {
            if (!$scope.localLoading) return;
            if ($scope.settings.perspective && $scope.settings.perspective.value === "-1") {
                $location.path("/perspectives");
                return;
            }

            // if we pick a perspective from the default property, update the default perspective for dashboard like date
            if ($rootScope.me.settings.defaultPropertyId.toString() === $scope.settings.perspective.propertyId.toString() || $scope.settings.perspective.propertyId.toString() === "") {
                $cookieSettingsService.savePerspective($scope.settings.perspective.value);
            }

            $scope.loadProperty($scope.propertyId);
        }, true);

        $scope.resetProfile = function() {
            $scope.defaultShowProfile();
            $cookies.put('pr.s');
        }

        $scope.saveShowProfile = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('pr.s', JSON.stringify($scope.showProfile), {expires : expireDate})
        }
        /***************************/

        $scope.setRenderable = function() {
            // $scope.debug += "(" + $cookies.get("selectedEndDate") + ") [" + moment($scope.settings.daterange.selectedEndDate).format() + "]";
            window.setTimeout(function() {
                window.renderable = true;
            },1000)
        }

        $scope.saveShow = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('fp.s', JSON.stringify($scope.settings.show), {expires : expireDate})
        }

        $scope.$watch('settings.daterange', function(d,old) {
            if (!$scope.localLoading) return;
            if (JSON.stringify(old) === JSON.stringify(d)) return;
            $cookieSettingsService.saveDaterange($scope.settings.daterange)
            $scope.loadProperty($scope.propertyId);
        }, true);

        $scope.$watch('settings.graphs', function() {
            if (!$scope.localLoading) return;

            $cookieSettingsService.saveGraphs($scope.settings.graphs)
            $scope.refreshGraphs();
        }, true);


        $scope.$watch('settings.nerScale', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveNerScale($scope.settings.nerScale)
            $scope.refreshGraphs();
        }, true);

        $scope.refreshGraphs = function() {
            $scope.loadProperty($scope.propertyId, true);
        }


        $scope.loadProperty = function(defaultPropertyId, trendsOnly) {

            if (defaultPropertyId) {

                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }

                var daterange = $scope.settings.daterange;

                if (phantom) {
                    daterange.selectedRange = $cookies.get("selectedRange");
                    daterange.selectedStartDate = $cookies.get("selectedStartDate");
                    daterange.selectedEndDate = $cookies.get("selectedEndDate");
                }

                $propertyService.profile(defaultPropertyId,
                    {
                        daterange: daterange.selectedRange,
                        start: daterange.selectedStartDate,
                        end: daterange.selectedEndDate
                    },
                    {
                        occupancy: true, ner: true, traffic: true, leases: true, bedrooms: true, graphs: $scope.settings.graphs, leased: $rootScope.me.settings.showLeases, renewal: $rootScope.me.settings.showRenewal, scale: $scope.settings.nerScale,
                        atr: $rootScope.me.settings.showATR
                    },
                    $scope.settings.perspective && $scope.settings.perspective.value ? $scope.settings.perspective.propertyId : $scope.propertyId,
                    $scope.settings.perspective && $scope.settings.perspective.value ? $scope.settings.perspective.value : null,

                ).then(function (response) {
                    var resp = $propertyService.parseProfile(response.data.profile,$scope.settings.graphs, $rootScope.me.settings.showLeases, $rootScope.me.settings.showRenewal, $scope.settings.nerScale, $rootScope.me.settings.showATR);

                    $scope.columns = ['occupancy'];

                    if ($rootScope.me.settings.showLeases) {
                        $scope.columns.push('leased');
                    }
                    if ($rootScope.me.settings.showRenewal) {
                        $scope.columns.push('renewal');
                    }
                    if ($rootScope.me.settings.showATR) {
                        $scope.columns.push('atr');
                    }
                    $scope.columns.push('leases');
                    $scope.columns.push('traffic');

                    if (!resp) {
                        $location.path('/dashboard')
                        return;
                    }

                    if (!trendsOnly) {
                        $scope.lookups = resp.lookups;
                        $scope.property = resp.property;
                        $scope.canManage = resp.canManage;
                        $scope.owner = resp.owner;
                        $scope.roles = $rootScope.me.roles;
                        $scope.canSurvey = resp.canSurvey && $scope.roles[0] != "Property Owner";
                        $scope.comp = resp.comp;
                        window.setTimeout(function() {$window.document.title = $scope.property.name + " - Profile | BI:Radix";},1500);

                        $auditService.create({type: 'property_profile', property: {id: resp.property._id, name: resp.property.name, orgid: resp.property.orgid}, description: resp.property.name});
                    }

                    $scope.coverPage = {
                        date: moment().utcOffset($scope.timezone).format("MMM Do, YYYY"),
                        isCustom: $scope.property.custom && $scope.property.custom.owner,
                        reports: [{name: $scope.property.name, items : ['Property Profile']}],
                        org: $rootScope.me.orgs[0],
                        strRange: $scope.property.strRangeEnd ? $scope.property.strRangeStart + " - " + $scope.property.strRangeEnd : ""
                    };

                    $scope.settings.points = resp.points;
                    $scope.surveyData = resp.surveyData;
                    $scope.nerData = resp.nerData
                    $scope.occData = resp.occData;
                    $scope.otherData = resp.otherData;
                    $scope.nerKeys = resp.nerKeys;
                    $scope.otherTable = resp.otherTable

                    if (!resp.canManage && $rootScope.me.roles[0] == 'Guest') {

                        $propertyService.search({select: "survey name", permission: ['PropertyManage'], skipAmenities: true}).then(function(response) {
                            var validSurveys = _.find(response.data.properties, function(x) {
                                var surveyDaysAgo = 99;

                                if (x.survey && x.survey.date) {
                                    surveyDaysAgo = (new Date().getTime() - (new Date(x.survey.date)).getTime()) / 1000 / 60 / 60 / 24;
                                }

                                return surveyDaysAgo < 7
                            })

                            if(!validSurveys) {
                                $location.path('/dashboard2')
                            } else {

                                $scope.localLoading = true;
                                $scope.trendsLoading = true;

                                $scope.setRenderable();
                            }
                        }, function(error) {
                            $location.path('/dashboard2')
                        })


                    } else {
                        $scope.localLoading = true;
                        $scope.trendsLoading = true;

                        $scope.setRenderable();

                    }

                    if ($scope.comp.survey && $scope.comp.survey.tier == "danger") {
                        if ($scope.comp.survey.date) {
                            toastr.error('Property has not been updated in ' + Math.round($scope.comp.survey.days) + ' days.');
                        }
                    }

                    if ($scope.comp.survey && $scope.comp.survey.tier == "warning") {
                        if ($scope.comp.survey.date) {
                            toastr.warning('Property has not been updated in ' + Math.round($scope.comp.survey.days) + ' days.');
                        }
                    }

                    if (!$scope.comp.survey || !$scope.comp.survey.date && !$scope.property.strRangeEnd) {
                        toastr.error('No Property Surveys have been done for this property.');
                    }

                }, function(error) {
                    window.renderable = true;
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }

                    $scope.apiError = true;
                    $scope.localLoading = true;
                });
            }
        };

        $scope.width = function() {
            return $(window).width()
        }

        $scope.$on('data.reload', function(event, args) {
            $scope.loadProperty($scope.propertyId)
        });

        $scope.checkProgress = function() {

            $progressService.isComplete($scope.progressId, function(isComplete) {

                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    $window.setTimeout($scope.checkProgress, 500);
                }
            })

        }

        $scope.excel = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                timezone: $scope.timezone,
                selectedStartDate: $scope.settings.daterange.selectedStartDate.format(),
                selectedEndDate: $scope.settings.daterange.selectedEndDate.format(),
                selectedRange: $scope.settings.daterange.selectedRange,
                progressId: $scope.progressId,
                compids: null,
                perspective: $scope.settings.selectedPerspective
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = gAPI + '/api/1.0/properties/' + ($scope.settings.perspective && $scope.settings.perspective.value ? $scope.settings.perspective.propertyId : $scope.property._id) + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key;

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.settings.daterange.selectedRange});

        }

        $scope.pdf = function(full) {
            if (full) {
                return $location.path("/reporting").search('property', '1');
            }

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var daterange = $scope.settings.daterange;

            $exportService.print($scope.property._id, true, daterange, $scope.progressId, $scope.settings.graphs, $scope.settings.perspective.value);

            $window.setTimeout($scope.checkProgress, 500);
        };


        $scope.print = function() {
            $exportService.print($scope.property._id, "", $scope.settings.daterange, "", $scope.settings.graphs, $scope.settings.perspective.value);
        };
    }]);
});
