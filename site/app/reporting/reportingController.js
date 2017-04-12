'use strict';
define([
    'app',
    '../../components/reports/communityAmenities.js',
    '../../components/reports/locationAmenities.js',
    '../../components/reports/feesDeposits.js',
    '../../components/reports/propertyRankings.js',
    '../../components/reports/propertyRankingsSummary.js',
    '../../components/reports/propertyStatus.js',
    '../../components/reports/propertyReport.js',
    '../../services/auditService',
    '../../services/progressService',
    '../../services/reportingService',
    '../../services/urlService',
    'css!../../components/reports/reporting'
], function (app) {

    app.controller('reportingController', ['$scope','$rootScope','$location','$propertyService','$auditService', 'ngProgress', '$progressService','$cookies','$window','toastr','$reportingService','$stateParams','$urlService', function ($scope,$rootScope,$location,$propertyService,$auditService,ngProgress,$progressService,$cookies,$window,toastr,$reportingService,$stateParams,$urlService) {
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
        $scope.reportItems.push({id: "property_report", name: "Market Survey Summary", selected:$stateParams.property == "1", group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "community_amenities", name: "Community Amenities", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "fees_deposits", name: "Fees & Deposits", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "location_amenities", name: "Location Amenities", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_rankings_summary", name: "Property Rankings", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_rankings", name: "Property Rankings (detailed)", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_status", name: "Property Status", selected:false, group: "Portfolio Reports", type:"multiple"});

        $scope.propertyItems = [];

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {

                $scope.dashboardSettings = $reportingService.getDashboardSettings($rootScope.me, $(window).width());
                $scope.profileSettings = $reportingService.getProfileSettings($(window).width());
                $scope.showProfile = $reportingService.getInfoRows($rootScope.me);
                $scope.reload($stateParams.property == "1");
                me();
            }
        })

        $scope.reload = function(bRun) {
            $propertyService.search({
                limit: 10000,
                permission: 'PropertyManage',
                active: true,
                select: "_id name comps.id comps.orderNumber orgid address"
                , skipAmenities: true
            }).then(function (response) {
                $scope.myProperties = response.data.properties;


                // $scope.debug = {
                //     a: 'test',
                //     c: $cookies.get("compIds"),
                // }
                // return window.renderable = true;

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
                    $scope.selected.Property = _.find($scope.myProperties, function (x) {
                        return x._id.toString() == id
                    })
                }


                if ($scope.selected.Property || $scope.reportType) {
                    $scope.loadComps(bRun)
                } else {
                    window.setTimeout(function () {
                        window.document.title = "Reporting | BI:Radix";
                    }, 1500);
                    $scope.localLoading = true;
                }


            }, function (error) {
                window.renderable = true;
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }

                $scope.localLoading = true;
            })
        }

        $scope.loadComps = function(bRun) {
            var compids = _.pluck($scope.selected.Property.comps,"id");
            var subjectid = $scope.selected.Property._id;

            window.setTimeout(function() {window.document.title = $scope.selected.Property.name + " - Reporting | BI:Radix";},1500);
            $scope.reportLoading = false;
            $scope.noReports = false;
            delete $scope.reports;

            $propertyService.search({
                limit: 10000, permission: 'PropertyView', active: true, select : "_id name address", ids: compids, sort: "name"
                , skipAmenities: true
            }).then(function (response) {
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
                        $scope.items.push({id: c._id, name: c.name, selected: true, address: c.address});
                    }
                })
                $scope.localLoading = true;



                if ($cookies.get("reportIds")) {

                    if (!_.isArray($cookies.get("reportIds"))) {
                        $scope.reportIds = $cookies.get("reportIds").split(",");
                    } else {
                        $scope.reportIds = $cookies.get("reportIds");
                    }

                    $scope.reportItems.forEach(function(x,i) {
                        $scope.reportItems[i].selected = $cookies.get("reportIds").indexOf(x.id) > -1
                    })

                    $scope.items.forEach(function(x,i) {
                        $scope.items[i].selected = $cookies.get("compIds").indexOf(x.id) > -1
                    })


                    $scope.run();
                } else if (bRun) {
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
            var reportNames = _.clone($scope.reportNames);
            $scope.reportNames.forEach(function(x,i) {$scope.reportNames[i] = {description: 'Report: ' + x}});


            if ($scope.reportIds.length == 0) {
                $scope.noReports = true;
                $scope.reportLoading = false;
                window.renderable = true;
                return;
            }



            if ($scope.reportType == "single") {

                $scope.coverPage = {
                    date: moment().format("MMM Do, YYYY"),
                    reports: [{name: $scope.selected.Property.name, items : reportNames}],
                    org: $rootScope.me.orgs[0]
                }

                $scope.singleReport();
            } else {

                var properties =  _.pluck(_.filter($scope.propertyItems,function(x) {return x.selected == true}),"name");
                var reports = [];

                reportNames.forEach(function(r) {
                    reports.push({name:r, items : properties})
                })

                $scope.coverPage = {
                    date: moment().format("MMM Do, YYYY"),
                    reports: reports,
                    org: $rootScope.me.orgs[0]
                }

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

            $reportingService.reportsGroup($scope.propertyIds,$scope.reportIds).then(function(response) {
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = '%where%, ' + $scope.propertyNames.length + ' Property(ies), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.auditMultiple('report', 'Website');
                }

                window.setTimeout(function() {
                    window.renderable = true;
                },1000)


            });




        }
        $scope.singleReport = function() {
            $scope.selected.Comps = _.filter($scope.items,function(x) {return x.selected == true})
            $scope.compIds =  _.pluck($scope.selected.Comps,"id")
            $scope.compNames =  _.pluck($scope.selected.Comps,"name")
            $scope.compNames.forEach(function(x,i) {$scope.compNames[i] = {description: 'Comp: ' + x}});



            var options = {};

            if ($scope.reportIds.indexOf("property_report") > -1) {
                options.property_report = {
                    summary: $scope.dashboardSettings.summary,
                    bedrooms: $scope.dashboardSettings.selectedBedroom,
                    daterange: {
                        daterange: $scope.dashboardSettings.daterange.selectedRange,
                        start: $scope.dashboardSettings.daterange.selectedStartDate,
                        end: $scope.dashboardSettings.daterange.selectedEndDate
                    },
                    show: {
                        graphs: $scope.profileSettings.graphs
                        , scale: $scope.dashboardSettings.nerScale
                    },
                    offset: moment().utcOffset()
                }
            }

            $reportingService.reports(
                $scope.compIds
                ,$scope.selected.Property._id
                ,$scope.reportIds
                ,options
            ).then(function(response) {
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = $scope.selected.Property.name + ': %where%, ' + $scope.compIds.length + ' Comp(s), ' + $scope.reportIds.length + ' Report Type(s)';

                $scope.rankingsSummary = $scope.reportIds.indexOf("property_rankings_summary") > -1;
                $scope.rankings = $scope.reportIds.indexOf("property_rankings") > -1;
                $scope.property_report = $scope.reportIds.indexOf("property_report") > -1;


                if (!phantom) {
                    $scope.audit('report', 'Website');
                }

                window.setTimeout(function() {
                    window.renderable = true;
                },1000)


            });
        }


        $scope.pdf = function(showFile) {

            if ($scope.reportType == "single") {
                $scope.audit('report_pdf','Pdf');
            } else {
                $scope.auditMultiple('report_pdf','Pdf');
            }

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                compIds :  encodeURIComponent($scope.compIds),
                reportIds:  encodeURIComponent($scope.reportIds),
                progressId: $scope.progressId,
                timezone: moment().utcOffset(),
                type: $scope.reportType,
                propertyIds:  encodeURIComponent($scope.propertyIds),
                showFile: showFile,

                Graphs: $scope.profileSettings.graphs,
                Summary: $scope.dashboardSettings.summary,
                Scale: $scope.dashboardSettings.nerScale,
                selectedStartDate: $scope.dashboardSettings.daterange.selectedStartDate.format(),
                selectedEndDate: $scope.dashboardSettings.daterange.selectedEndDate.format(),
                selectedRange: $scope.dashboardSettings.daterange.selectedRange,
                Totals: $scope.dashboardSettings.totals,
                Bedrooms: $scope.dashboardSettings.selectedBedroom,
                orderBy: $scope.profileSettings.orderByFp,
                orderByC: $scope.dashboardSettings.orderByComp,
                show: encodeURIComponent(JSON.stringify($scope.profileSettings.show)),
                showC: encodeURIComponent(JSON.stringify($scope.dashboardSettings.show)),
                showP: encodeURIComponent(JSON.stringify($scope.showProfile))
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = '/api/1.0/properties/' + $scope.selected.Property._id + '/reportsPdf?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key

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


        $scope.excel = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                timezone: moment().utcOffset(),
                selectedStartDate: $scope.dashboardSettings.daterange.selectedStartDate.format(),
                selectedEndDate: $scope.dashboardSettings.daterange.selectedEndDate.format(),
                selectedRange: $scope.dashboardSettings.daterange.selectedRange,
                progressId: $scope.progressId,
                compids: $scope.compIds
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = '/api/1.0/properties/' + $scope.selected.Property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key;

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.settings.daterange.selectedRange});

        }

    }]);
});