'use strict';
define([
    'app',
    '../../components/reports/communityAmenities.js',
    '../../components/reports/locationAmenities.js',
    '../../components/reports/feesDeposits.js',
    '../../components/reports/propertyRankings.js',
    '../../components/reports/marketShare.js',
    '../../components/reports/propertyStatus.js',
    '../../services/auditService',
    '../../services/progressService',
], function (app) {

    app.controller('reportingController', ['$scope','$rootScope','$location','$propertyService','$auditService', 'ngProgress', '$progressService','$cookies','$window','toastr', function ($scope,$rootScope,$location,$propertyService,$auditService,ngProgress,$progressService,$cookies,$window,toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $scope.selected = {};
        $scope.reportIds = [];
        $scope.reportType = "";

        $rootScope.nav = "Reporting";

        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Reporting";

        $scope.propertyOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Properties", labelSelected: "Selected Properties", searchLabel: "Properties" }
        $scope.options = { hideSearch: true, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Comps", labelSelected: "Selected Comps", searchLabel: "Comps" }
        $scope.reportOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Reports", labelSelected: "Selected Reports", searchLabel: "Reports" }

        $scope.reportItems = []
        $scope.reportItems.push({id: "property_rankings", name: "Property Rankings", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "market_share", name: "Market Share", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "community_amenities", name: "Community Amenities", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "location_amenities", name: "Location Amenities", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "fees_deposits", name: "Fees & Deposits", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_status", name: "Property Status", selected:false, group: "Portfolio Reports", type:"multiple"});

        $scope.propertyItems = [];

        $propertyService.search({limit: 10000, permission: 'PropertyManage', active: true, select : "_id name comps.id comps.orderNumber orgid"}).then(function (response) {
            $scope.myProperties = response.data.properties;


            var id = $rootScope.me.settings.defaultPropertyId;

            if ($cookies.get("subjectId")) {
                id = $cookies.get("subjectId");
            }

            if ($cookies.get("propertyIds")) {
                $scope.propertyIds = $cookies.get("propertyIds");
            }

            $scope.myProperties.forEach(function (a) {
                var sel = false;

                if ($scope.propertyIds) {
                    sel = $scope.propertyIds.indexOf(a._id) > -1
                }

                $scope.propertyItems.push({id: a._id, name: a.name, selected: sel})
            })

            if ($cookies.get("type")) {
                $scope.reportType = $cookies.get("type");
            }
            
            if (!$scope.myProperties || $scope.myProperties.length == 0) {
                id = null;
            }
            else if (!id) {
                $scope.selected.Property = $scope.myProperties[0];
            } else {
                $scope.selected.Property = _.find($scope.myProperties, function(x) {return x._id.toString() == id})
            }

            if ($scope.selected.Property || $scope.reportType) {
                $scope.loadComps()
            } else {
                window.setTimeout(function() {window.document.title = "Reporting | BI:Radix";},1500);
                $scope.localLoading = true;
            }


        }, function(error) {
            if (error.status == 401) {
                $rootScope.logoff();
                return;
            }

            $scope.localLoading = true;
        })

        $scope.loadComps = function() {

            var compids = _.pluck($scope.selected.Property.comps,"id");
            var subjectid = $scope.selected.Property._id;

            window.setTimeout(function() {window.document.title = $scope.selected.Property.name + " - Reporting | BI:Radix";},1500);
            $scope.reportLoading = false;
            $scope.noReports = false;
            delete $scope.reports;

            $propertyService.search({limit: 10000, permission: 'PropertyView', active: true, select : "_id name", ids: compids, sort: "name"}).then(function (response) {
                $scope.items = [];

                response.data.properties.forEach(function(c) {
                    var comp = _.find($scope.selected.Property.comps, function (x) {
                        return x.id.toString() == c._id.toString()
                    });

                    c.orderNumber = 999;

                    if (comp && typeof comp.orderNumber != 'undefined') {
                        c.orderNumber = comp.orderNumber;
                    }
                });

                response.data.properties = _.sortByAll(response.data.properties, ['orderNumber','name']);

                response.data.properties.forEach(function(c) {
                    if (c._id != subjectid) {
                        $scope.items.push({id: c._id, name: c.name, selected: true});
                    }
                })
                $scope.localLoading = true;

                if ($cookies.get("reportIds")) {

                    $scope.reportItems.forEach(function(x,i) {
                        $scope.reportItems[i].selected = $cookies.get("reportIds").indexOf(x.id) > -1
                    })

                    $scope.items.forEach(function(x,i) {
                        $scope.items[i].selected = $cookies.get("compIds").indexOf(x.id) > -1
                    })

                    $scope.reportIds = $cookies.get("reportIds");

                    $scope.run();
                }

            })

        }

        $scope.changeProperty = function() {
            $scope.localLoading = false;
            $scope.loadComps();
        }

        $scope.run = function() {
            $scope.reports = null;
            $scope.reportLoading = true;
            $scope.noReports = false;
            $scope.noProperties = false;

            $scope.reportNames = _.pluck(_.filter($scope.reportItems,function(x) {return x.selected == true}),"name");
            $scope.reportNames.forEach(function(x,i) {$scope.reportNames[i] = {description: 'Report: ' + x}});


            if ($scope.reportIds.length == 0) {
                $scope.noReports = true;
                $scope.reportLoading = false;
                window.renderable = true;
                return;
            }

            if ($scope.reportType == "single") {
                $scope.singleReport();
            } else {
                $scope.multipleReport();
            }

        }
        $scope.multipleReport = function() {
            var properties = _.filter($scope.propertyItems,function(x) {return x.selected == true});

            if ($scope.myProperties.length == 1) {
                properties = [$scope.selected.Property._id];
            }

            if (!properties.length) {
                $scope.noProperties = true;
                $scope.reportLoading = false;
                return;
            }

            $scope.propertyNames =  _.pluck(properties,"name")
            $scope.propertyNames.forEach(function(x,i) {$scope.propertyNames[i] = {description: 'Property: ' + x}});
            $scope.propertyIds =  _.pluck(properties,"id")

            $propertyService.reportsGroup($scope.propertyIds,$scope.reportIds).then(function(response) {
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = '%where%, ' + $scope.propertyNames.length + ' Property(ies), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.auditMultiple('report', 'Website');
                }

                window.setTimeout(function() {
                    window.renderable = true;
                },600)


            });




        }
        $scope.singleReport = function() {
            $scope.selected.Comps = _.filter($scope.items,function(x) {return x.selected == true})
            $scope.compIds =  _.pluck($scope.selected.Comps,"id")
            $scope.compNames =  _.pluck($scope.selected.Comps,"name")
            $scope.compNames.forEach(function(x,i) {$scope.compNames[i] = {description: 'Comp: ' + x}});

            $scope.rankings = $scope.reportIds.indexOf("property_rankings") > -1;
            $scope.marketShare = $scope.reportIds.indexOf("market_share") > -1;

            $propertyService.reports(
                $scope.compIds
                , $scope.selected.Property._id
                ,$scope.reportIds
            ).then(function(response) {
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = $scope.selected.Property.name + ': %where%, ' + $scope.compIds.length + ' Comp(s), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.audit('report', 'Website');
                }

                window.setTimeout(function() {
                    window.renderable = true;
                },600)


            });
        }

        $scope.pdf = function(showFile) {

            if ($scope.reportType == "single") {
                $scope.audit('report_pdf','Pdf');
            } else {
                $scope.auditMultiple('report_pdf','Pdf');
            }

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.selected.Property._id + '/reportsPdf?'
            url += "token=" + $cookies.get('token')
            url += "&compIds=" + $scope.compIds
            url += "&reportIds=" + $scope.reportIds
            url += "&progressId=" + $scope.progressId
            url += "&timezone=" + moment().utcOffset()
            url += "&type=" + $scope.reportType
            url += "&propertyIds=" + $scope.propertyIds
            url += "&showFile=" + showFile


            if (showFile === true) {
                ngProgress.start();

                $('#export').prop('disabled', true);

                window.setTimeout($scope.checkProgress, 500);
                location.href = url;
            }
            else {
                window.open(url);
            }

        }

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

        $scope.audit = function(type, where) {
            $auditService.create({type: 'report', property: $scope.selected.Property, description: $scope.description.replace('%where%',where), data: $scope.compNames.concat($scope.reportNames)});
        }

        $scope.auditMultiple = function(type, where) {
            $auditService.create({type: 'report', description: $scope.description.replace('%where%',where), data: $scope.propertyNames.concat($scope.reportNames)});
        }
        $scope.$watch('reportItems', function() {
            var reportIds = _.pluck(_.filter($scope.reportItems,function(x) {return x.selected == true}),"id");

            var diff = _.difference(reportIds,$scope.reportIds);

            var oldReportType = $scope.reportType;

            if (!reportIds.length) {
                $scope.reportType = "";
            } else
            if (diff && diff.length > 0) {
                $scope.reportType = _.find($scope.reportItems, function(x) {return x.id == diff[0]}).type;
                $scope.reportItems.forEach(function(x) {
                    if (x.type != $scope.reportType && x.selected === true) {
                        x.selected = false;
                    }
                })

                if (oldReportType && $scope.reportType && oldReportType != $scope.reportType) {
                    toastr.warning("Different types of reports (Portfolio and Individual) can't be run at the same time, please run them separately");
                }
            }

            $scope.reportIds = reportIds;
        },true)

    }]);
});