'use strict';
define([
    'app',
    '../../components/jstimezonedetect/jstz.min',
    '../../services/cookieSettingsService',
    '../../services/progressService',
    '../../services/auditService',
    '../../services/reportingService',
    '../../services/urlService',
], function (app,jstz) {

    app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService','$cookies','$progressService','ngProgress','$auditService','toastr','$stateParams','$reportingService','$urlService', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$cookies,$progressService,ngProgress,$auditService,toastr,$stateParams,$reportingService,$urlService) {
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Dashboard";
        $scope.filters = {searchDashboard : ""};

        $scope.localLoading = false;

        $scope.defaultShow = function() {
            $scope.settings.show = $reportingService.getDefaultDashboardCompColumns($rootScope.me,$(window).width());
        }

        $scope.reset = function() {
            $scope.defaultShow();
            $cookies.put('cmp.s');
            $scope.settings.orderByComp = "number";
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.o', $scope.settings.orderByComp, {expires : expireDate})
        }

        $scope.saveShow = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.s', JSON.stringify($scope.settings.show), {expires : expireDate})
        }
        /**********************************************/
        $scope.defaultShowProfile = function() {
            $scope.showProfile = $reportingService.getDefaultInfoRows($rootScope.me);
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

        $scope.$watch('settings.nerScale', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveNerScale($scope.settings.nerScale)
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('settings.daterange', function(d,old) {
            if (!$scope.localLoading) return;
            var oldHash = old.selectedStartDate.format("MMDDYYYY") + old.selectedEndDate.format("MMDDYYYY")
            var newHash = d.selectedStartDate.format("MMDDYYYY") + d.selectedEndDate.format("MMDDYYYY")
            if(oldHash == newHash) return;

            $cookieSettingsService.saveDaterange($scope.settings.daterange)
            //console.log('from date')
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('settings.summary', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveSummary($scope.settings.summary)
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('settings.totals', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveTotals($scope.settings.totals)
        }, true);

        $scope.refreshGraphs = function() {
            if (!$scope.localLoading) return;

            $scope.settings.selectedBedroom = $scope.bedroom.value;
            $cookieSettingsService.saveBedrooms($scope.settings.selectedBedroom);
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

                $scope.settings = $reportingService.getDashboardSettings($rootScope.me, $(window).width());
                $scope.showProfile = $reportingService.getInfoRows($rootScope.me);

                if (!$rootScope.me.settings.tz) {
                    $rootScope.me.settings.tz = jstz.determine().name();
                    $authService.updateSettings($rootScope.me.settings);
                }

                if ($rootScope.me.roles[0] == 'Guest') {
                    $location.path('/dashboard2')
                    return;
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
            $scope.loadProperty($scope.selectedProperty ? $scope.selectedProperty._id : null);
            $rootScope.me.settings.defaultPropertyId = $scope.selectedProperty ? $scope.selectedProperty._id : null;
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
                    , $scope.settings.summary
                    , $scope.settings.selectedBedroom
                    , {
                        daterange: $scope.settings.daterange.selectedRange,
                        start: $scope.settings.daterange.selectedStartDate,
                        end: $scope.settings.daterange.selectedEndDate
                        }
                    ,{ner: true, occupancy: true, leased: true, graphs: true, scale: $scope.settings.nerScale}
                ).then(function (response) {

                    var resp = $propertyService.parseDashboard(response.data,$scope.settings.summary, $rootScope.me.settings.showLeases, $scope.settings.nerScale, $scope.settings.selectedBedroom);

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
                            $scope.setProperty(null)
                        } else {
                            $scope.setProperty($scope.myProperties[0])
                        }

                    }

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
            $location.path("/reporting").search('property', '1');

        }

        $scope.excel = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                timezone: moment().utcOffset(),
                selectedStartDate: $scope.settings.daterange.selectedStartDate.format(),
                selectedEndDate: $scope.settings.daterange.selectedEndDate.format(),
                selectedRange: $scope.settings.daterange.selectedRange,
                progressId: $scope.progressId,
                compids: null
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = '/api/1.0/properties/' + $scope.property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key;

            window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.settings.daterange.selectedRange});

        }


    }]);
});