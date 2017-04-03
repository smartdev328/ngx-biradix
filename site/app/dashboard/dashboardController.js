'use strict';
define([
    'app',
    '../../components/jstimezonedetect/jstz.min',
    '../../components/propertyProfile/comps',
    '../../components/googleMap/module',
    '../../services/cookieSettingsService',
    '../../services/exportService',
    '../../services/progressService',
    '../../services/auditService',
], function (app,jstz) {

    app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService','$cookies','$exportService','$progressService','ngProgress','$auditService','toastr','$stateParams', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$cookies,$exportService,$progressService,ngProgress,$auditService,toastr,$stateParams) {
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Dashboard";
        $scope.filters = {searchDashboard : ""};
        $scope.options = {};
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.options.summary = $cookieSettingsService.getSummary();

        $scope.graphs = $cookieSettingsService.getGraphs();

        $scope.totals = $cookieSettingsService.getTotals();

        $scope.options.nerScale = $cookieSettingsService.getNerScale();

        $scope.selectedBedroom = $cookieSettingsService.getBedrooms();

        $scope.orderByComp = "number";

        if ($cookies.get("cmp.o")) {
            $scope.orderByComp = $cookies.get("cmp.o");
        }

        /*************************************/
        $scope.defaultShow = function() {
            $scope.show = {
                units: true,
                unitPercent: false,
                occupancy: true,
                leased: $rootScope.me.settings.showLeases,
                renewal: $rootScope.me.settings.showRenewal,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false,
                weekly:false
            }


            var w = $(window).width();

            if (w < 1175) {
                $scope.show.rent = false;
                $scope.show.concessions = false;
            }

            if (w < 1000) {
                $scope.show.ner = false;
            }

            if (w < 500) {
                $scope.show.sqft = false;
                $scope.show.occupancy = false;
                $scope.show.leased = false
                $scope.show.renewal = false
                $scope.show.units = false;
            }
        }

        $scope.reset = function() {
            $scope.defaultShow();
            $cookies.put('cmp.s');
            $scope.orderByComp = "number";
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.o', $scope.orderByComp, {expires : expireDate})
        }

        $scope.saveShow = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.s', JSON.stringify($scope.show), {expires : expireDate})
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

        $scope.$watch('options.nerScale', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveNerScale($scope.options.nerScale)
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('daterange', function(d,old) {
            if (!$scope.localLoading) return;
            var oldHash = old.selectedStartDate.format("MMDDYYYY") + old.selectedEndDate.format("MMDDYYYY")
            var newHash = d.selectedStartDate.format("MMDDYYYY") + d.selectedEndDate.format("MMDDYYYY")
            if(oldHash == newHash) return;

            $cookieSettingsService.saveDaterange($scope.daterange)
            //console.log('from date')
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('options.summary', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveSummary($scope.options.summary)
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('totals', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveTotals($scope.totals)
        }, true);

        $scope.refreshGraphs = function() {
            if (!$scope.localLoading) return;

            $scope.selectedBedroom = $scope.bedroom.value;
            $cookieSettingsService.saveBedrooms($scope.selectedBedroom);
            $scope.loadProperty($scope.selectedProperty._id, true);
        }

        $scope.first = true;
        $scope.showSearch = false;
        $scope.showInList = 100;
        $scope.initialLength = 0;

        $scope.autocomplete = function(search) {
            $propertyService.search({
                limit: $scope.showInList,
                permission: 'PropertyManage',
                active: true,
                search:search
                , skipAmenities: true
            }).then(function (response) {
                $scope.myProperties = response.data.properties;
            }, function (error) {

            })

        }

        //make sure me is loaded befor you search initially
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();
                $scope.defaultShow();

                if ($cookies.get("cmp.s")) {
                    $scope.show = JSON.parse($cookies.get("cmp.s"));
                }

                if (!$rootScope.me.settings.tz) {
                    $rootScope.me.settings.tz = jstz.determine().name();
                    $authService.updateSettings($rootScope.me.settings);
                }

                if ($rootScope.me.roles[0] == 'Guest') {
                    $location.path('/dashboard2')
                    return;
                }

                $scope.defaultShowProfile();

                if ($cookies.get("pr.s")) {
                    //$scope.showProfile = JSON.parse($cookies.get("pr.s"));
                }

                $propertyService.search({
                    limit: $scope.showInList + 1,
                    permission: 'PropertyManage',
                    active: true
                    , skipAmenities: true
                }).then(function (response) {
                    $scope.myProperties = response.data.properties;

                    if ($scope.first) {
                        $scope.initialLength = $scope.myProperties.length;

                        if ($scope.myProperties.length > 7) {
                            $scope.showSearch = true;
                        }
                    }

                    var id = $rootScope.me.settings.defaultPropertyId;

                    if($stateParams.id) {
                        id = $stateParams.id;
                    }


                    if (!$scope.myProperties || $scope.myProperties.length == 0) {
                        id = null;
                    }
                    else if (!id) {
                        $scope.selectedProperty = $scope.myProperties[0];
                    } else {
                        $scope.selectedProperty = {_id: id}

                        //if you lost access to your saved property, update your settings
                        if (!$scope.selectedProperty ) {
                            $scope.selectedProperty = $scope.myProperties[0];
                            $scope.changeProperty();
                            return;
                        }
                    }

                    if ($scope.selectedProperty) {
                        if($stateParams.id) {
                            $scope.changeProperty();
                        } else {
                            $scope.loadProperty($scope.selectedProperty._id)
                            // $scope.loadProperty("58cdc0bfa8c00c1158192b30")

                        }
                    } else {
                        //console.log('loading changed 1');
                        $scope.localLoading = true;
                    }

                }, function (error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }

                    toastr.error('Unable to access the system at this time. Please contact an administrator');
                    $scope.localLoading = true;
                })
            }
        });

        $scope.viewProfile = function() {
            $location.path("/profile/" + $scope.property._id);
        }

        $scope.changeProperty = function() {
            $scope.selectedBedroom = -1;
            $scope.loadProperty($scope.selectedProperty._id);
            $rootScope.me.settings.defaultPropertyId = $scope.selectedProperty._id;
            $authService.updateSettings($rootScope.me.settings).then(function() {
                $rootScope.refreshToken();
            });

        }

        $scope.setProperty = function(property) {
            $scope.selectedProperty = property;

            $scope.changeProperty();
        }

        $scope.$on('data.reload', function(event, args) {
            $scope.changeProperty();
        });

        $scope.loadProperty = function(defaultPropertyId, trendsOnly) {
            //console.log('loaded');
            if (defaultPropertyId) {
                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }
                $propertyService.dashboard(
                    defaultPropertyId
                    , $scope.options.summary
                    , $scope.selectedBedroom
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                        }
                    ,{ner: true, occupancy: true, leased: true, graphs: true, scale: $scope.options.nerScale}
                ).then(function (response) {

                    var resp = $propertyService.parseDashboard(response.data,$scope.options.summary, $rootScope.me.settings.showLeases, $scope.options.nerScale, $scope.selectedBedroom);

                    if (!trendsOnly) {
                        $scope.property = resp.property;
                        $scope.comps = resp.comps;
                        $scope.roles = $rootScope.me.roles;


                        $scope.mapOptions = resp.mapOptions;
                        $scope.bedrooms = resp.bedrooms;
                        $scope.bedroom = resp.bedroom;

                        window.document.title = resp.property.name + " - Dashboard | BI:Radix";
                    }

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;
                    $scope.leasedData = resp.leasedData;

                    //console.log('loading changed 2');

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;

                    if($stateParams.s == "1" && !$scope.surveyPopped) {
                        $rootScope.marketSurvey(defaultPropertyId,null, {trackReminders : true});
                        $scope.surveyPopped =  true;
                        $auditService.create({type: 'tracking_reminder_clicked', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name});
                    }

                }, function(error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    } else if (error.status == 400) {
                        if (!$scope.myProperties || $scope.myProperties.length == 0) {
                            $scope.selctedProperty = null;
                        } else {
                            $scope.selctedProperty = $scope.myProperties[0];
                            location.reload();

                        }
                    }

                    toastr.error('Unable to access the system at this time. Please contact an administrator');

                    $scope.localLoading = true;
                });
            }
        };

        $scope.checkProgress = function() {

            $progressService.isComplete($scope.progressId, function(isComplete) {

                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    window.setTimeout($scope.checkProgress, 500);
                }
            })

        }

        $scope.pdf = function(full) {

            ngProgress.start();


            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            $exportService.print($scope.property._id, full,true, $scope.daterange, $scope.progressId, $scope.graphs, $scope.totals, $scope.selectedBedroom);

            window.setTimeout($scope.checkProgress, 500);

        }

        $scope.print = function(full) {
            $exportService.print($scope.property._id, full,"", $scope.daterange, "", $scope.graphs, $scope.totals, $scope.selectedBedroom);
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

            window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.daterange.selectedRange});

        }


    }]);
});