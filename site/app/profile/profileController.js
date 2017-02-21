'use strict';
define([
    'app',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../components/propertyProfile/floorplans',
    '../../components/propertyProfile/tableView',
    '../../services/progressService',
    '../../services/cookieSettingsService',
    '../../services/auditService',
    '../../services/exportService'
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', '$window','$cookies', 'ngProgress', '$progressService', '$cookieSettingsService', '$auditService','$exportService','toastr', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams, $window, $cookies, ngProgress, $progressService, $cookieSettingsService, $auditService,$exportService,toastr) {
        $rootScope.nav = ''
        $rootScope.sideMenu = false;


        $scope.orderByFp = "sqft";

        if ($cookies.get("fp.o")) {
            $scope.orderByFp = $cookies.get("fp.o");
        }

        $scope.defaultShow = function() {
            $scope.show = {
                description: true,
                units: true,
                unitPercent: true,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false
            }

            var w = $(window).width();

            if (w < 1024) {
                $scope.show.rent = false;
                $scope.show.concessions = false;
                $scope.show.unitPercent = false;
            }

            if (w < 500) {
                $scope.show.ner = false;
                $scope.show.description = false;
            }

        }

        $scope.defaultShow();

        if ($cookies.get("fp.s")) {
            $scope.show = JSON.parse($cookies.get("fp.s"));
        }

        $scope.reset = function() {
            $scope.defaultShow();
            $cookies.remove('fp.s');
            $scope.orderByFp = "sqft";
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('fp.o', $scope.orderByFp, {expires : expireDate})


        }

        /**********************************************/
        $scope.defaultShowProfile = function() {
            $scope.showProfile = {
                address: true,
                website: false,
                phone: true,
                email: false,
                name: false,
                const: true,
                built: true,
                ren: false,
                owner: true,
                mgmt: true,
                units: true,
                occ: true,
                leased: $rootScope.me.settings.showLeases,
                renewal: $rootScope.me.settings.showRenewal,
                traf: true,
                lease: true
            }

        }

        //make sure me is loaded befor you search initially
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();
                $scope.defaultShowProfile();

                if ($cookies.get("pr.s")) {
                    $scope.showProfile = JSON.parse($cookies.get("pr.s"));
                }

                $scope.loadProperty($scope.propertyId)
            }
        });


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
            window.setTimeout(function() {
                window.renderable = true;
            },600)
        }

        $scope.saveShow = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('fp.s', JSON.stringify($scope.show), {expires : expireDate})
        }

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.$watch('daterange', function(d,old) {
            if (!$scope.localLoading) return;
            if(JSON.stringify(old) == JSON.stringify(d)) return;
            $cookieSettingsService.saveDaterange($scope.daterange)
            $scope.refreshGraphs();
        }, true);

        $scope.settings = {
            graphs: $cookieSettingsService.getGraphs(),
            nerScale: $cookieSettingsService.getNerScale(),
            totals: $cookieSettingsService.getTotals()
        };

        $scope.settings.graphs = $cookieSettingsService.getGraphs();

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

        $scope.propertyId = $stateParams.id;

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

                $propertyService.profile(defaultPropertyId
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                    }
                    ,{occupancy: true, ner: true, traffic: true, leases: true, bedrooms: true, graphs: $scope.settings.graphs, leased: $rootScope.me.settings.showLeases, renewal: $rootScope.me.settings.showRenewal, scale: $scope.settings.nerScale}
                ).then(function (response) {

                    var resp = $propertyService.parseProfile(response.data.profile,$scope.settings.graphs, $rootScope.me.settings.showLeases, $rootScope.me.settings.showRenewal, $scope.settings.nerScale);

                    $scope.columns = ['occupancy'];

                    if ($rootScope.me.settings.showLeases) {
                        $scope.columns.push('leased');
                    }
                    if ($rootScope.me.settings.showRenewal) {
                        $scope.columns.push('renewal');
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
                        $scope.canSurvey = resp.canSurvey;
                        $scope.owner = resp.owner;
                        $scope.roles = $rootScope.me.roles;
                        $scope.comp = resp.comp;
                        window.setTimeout(function() {$window.document.title = $scope.property.name + " - Profile | BI:Radix";},1500);

                        $auditService.create({type: 'property_profile', property: {id: resp.property._id, name: resp.property.name, orgid: resp.property.orgid}, description: resp.property.name});
                    }

                    $scope.points = resp.points;
                    $scope.surveyData = resp.surveyData;
                    $scope.nerData = resp.nerData
                    $scope.occData = resp.occData;
                    $scope.otherData = resp.otherData;
                    $scope.nerKeys = resp.nerKeys;
                    $scope.otherTable = resp.otherTable

                    if (!resp.canManage && $rootScope.me.roles[0] == 'Guest') {
                        //Todo: Check if any comps for this are up to date, if none, restrict access

                        var compids= _.map(resp.comp.comps,function(x) {return x.id.toString()});

                        $propertyService.search({select: "survey name", permission: ['PropertyManage']}).then(function(response) {
                            var validSurveys = _.find(response.data.properties, function(x) {
                                var surveyDaysAgo = 99;

                                if (x.survey  && x.survey.date) {
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

                    if (!$scope.comp.survey || !$scope.comp.survey.date) {
                        toastr.error('No market surveys have been done for this property.');
                    }

                }, function(error) {
                    window.renderable = true;
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }

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

            var url = '/api/1.0/properties/' + $scope.property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&timezone=" + moment().utcOffset()
            url += "&selectedStartDate=" + $scope.daterange.selectedStartDate.format()
            url += "&selectedEndDate=" + $scope.daterange.selectedEndDate.format()
            url += "&selectedRange=" + $scope.daterange.selectedRange
            url += "&progressId=" + $scope.progressId

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.daterange.selectedRange});

        }

        $scope.pdf = function(full) {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            $exportService.print($scope.property._id, full,true, $scope.daterange, $scope.progressId, $scope.settings.graphs, $scope.settings.totals);

            $window.setTimeout($scope.checkProgress, 500);

        }


        $scope.print = function(full) {

            $exportService.print($scope.property._id, full,"", $scope.daterange, "", $scope.settings.graphs, $scope.settings.totals);
        }

    }]);
});