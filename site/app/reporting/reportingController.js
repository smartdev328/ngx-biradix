'use strict';
define([
    'app',
    '../../components/reports/communityAmenities.js',
    '../../components/reports/locationAmenities.js',
    '../../components/reports/feesDeposits.js',
    '../../components/reports/propertyRankings.js',
    '../../components/reports/propertyRankingsSummary.js',
    '../../components/reports/propertyStatus.js',
    '../../components/reports/propertyReport.js'
], function (app) {

    app.controller('reportingController', ['$scope','$rootScope','$location','$propertyService','$auditService', 'ngProgress', '$progressService','$cookies','$window','toastr','$reportingService','$stateParams','$urlService','$timeout', function ($scope,$rootScope,$location,$propertyService,$auditService,ngProgress,$progressService,$cookies,$window,toastr,$reportingService,$stateParams,$urlService,$timeout) {
        // $scope.debug = {
        //     c: JSON.parse($cookies.get("settings")),
        // }
        // return window.renderable = true;
        $scope.selected = {};
        $scope.reportIds = [];
        $scope.reportType = "";

        $rootScope.nav = "Reporting";
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Reporting";

        $scope.temp = {};
        $scope.liveSettings = {};
        $scope.runSettings = {};

        $scope.propertyOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Properties", labelSelected: "Selected Properties", searchLabel: "Properties" }
        $scope.options = { hideSearch: true, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Comps", labelSelected: "Selected Comps", searchLabel: "Comps" }
        $scope.reportOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Reports", labelSelected: "Selected Reports", searchLabel: "Reports" }

        $scope.reportItems = []
        $scope.reportItems.push({id: "community_amenities", name: "Community Amenities", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "fees_deposits", name: "Fees & Deposits", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "location_amenities", name: "Location Amenities", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_report", name: "Market Survey Summary", selected:$stateParams.property == "1", group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_rankings_summary", name: "Property Rankings", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_rankings", name: "Property Rankings (detailed)", selected:false, group: "Individual Reports", type:"single"});
        $scope.reportItems.push({id: "property_status", name: "Property Status", selected:false, group: "Portfolio Reports", type:"multiple"});

        $scope.propertyItems = [];

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {

                if ($cookies.get("settings")) {
                    $scope.liveSettings = JSON.parse($cookies.get("settings"))
                } else {
                    $scope.resetPropertyReportSettings(false);
                    $scope.resetRankingsSettings(false);
                    $scope.resetRankingsSummarySettings(false);
                }
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
                        $scope.reportItems[i].selected =$scope.reportIds.indexOf(x.id) > -1
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
                properties = [$scope.selected.Property];
            }

            if (!properties.length) {
                $scope.noProperties = true;
                $scope.reportLoading = false;
                return;
            }

            $scope.propertyNames =  _.pluck(properties,"name")
            $scope.propertyNames.forEach(function(x,i) {$scope.propertyNames[i] = {description: 'Property: ' + x}});
            $scope.propertyIds =  _.pluck(properties,"id")

            $scope.runSettings = _.cloneDeep($scope.liveSettings);

            $reportingService.reportsGroup($scope.propertyIds,$scope.reportIds).then(function(response) {
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = '%where%, ' + $scope.propertyNames.length + ' Property(ies), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.auditMultiple('report', 'Website');
                }

                window.setTimeout(function() {
                    window.renderable = true;
                },200)


            });




        }
        $scope.singleReport = function() {
            $scope.selected.Comps = _.filter($scope.items,function(x) {return x.selected == true})
            $scope.compIds =  _.pluck($scope.selected.Comps,"id")
            $scope.compNames =  _.pluck($scope.selected.Comps,"name")
            $scope.compNames.forEach(function(x,i) {$scope.compNames[i] = {description: 'Comp: ' + x}});

            var options = {};

            if ($scope.reportIds.indexOf("property_report") > -1) {

                //Only check options after we have ran a report
                if (Object.keys($scope.runSettings).length && $scope.temp.bedroom) {
                    $scope.liveSettings.dashboardSettings.selectedBedroom = $scope.temp.bedroom.value;
                    $scope.liveSettings.showProfile = {};

                    $scope.temp.showProfileItems.forEach(function(f) {
                        $scope.liveSettings.showProfile[f.id] = f.selected;
                    })

                    $scope.temp.showCompItems.forEach(function(f) {
                        $scope.liveSettings.dashboardSettings.show[f.id] = f.selected;
                    })

                    $scope.temp.showFloorplanItems.forEach(function(f) {
                        $scope.liveSettings.profileSettings.show[f.id] = f.selected;
                    })

                    $scope.liveSettings.profileSettings.orderByFp = ($scope.temp.floorPlanSortDir == "desc" ? "-" : "") + $scope.temp.floorPlanSortSelected.id;

                    $scope.liveSettings.dashboardSettings.orderByComp = (($scope.temp.compSortDir == "desc" && $scope.temp.compSortSelected.id != "number") ? "-" : "") + $scope.temp.compSortSelected.id;

                }


                options.property_report = {
                    summary: $scope.liveSettings.dashboardSettings.summary,
                    bedrooms: $scope.liveSettings.dashboardSettings.selectedBedroom,
                    daterange: {
                        daterange: $scope.liveSettings.dashboardSettings.daterange.selectedRange,
                        start: $scope.liveSettings.dashboardSettings.daterange.selectedStartDate,
                        end: $scope.liveSettings.dashboardSettings.daterange.selectedEndDate
                    },
                    show: {
                        graphs: $scope.liveSettings.profileSettings.graphs
                        , scale: $scope.liveSettings.dashboardSettings.nerScale
                    },
                    offset: moment().utcOffset()
                }

            }

            if ($scope.reportIds.indexOf("property_rankings") > -1) {
                if ($scope.temp.rankingSortSelected) {
                    $scope.liveSettings.rankings.orderBy = ($scope.temp.rankingSortDir == "desc" ? "-" : "") + $scope.temp.rankingSortSelected.id;
                }
            }

            if ($scope.reportIds.indexOf("property_rankings_summary") > -1) {
                if ($scope.temp.rankingSummarySortSelected) {
                    $scope.liveSettings.rankingsSummary.orderBy = ($scope.temp.rankingSummarySortDir == "desc" ? "-" : "") + $scope.temp.rankingSummarySortSelected.id;
                }
            }

            $scope.runSettings = _.cloneDeep($scope.liveSettings);


            $reportingService.reports(
                $scope.compIds
                ,$scope.selected.Property._id
                ,$scope.reportIds
                ,options
            ).then(function(response) {
                //Run these after the reports are ran
                $scope.configurePropertyReportOptions();
                $scope.configureRankingsOptions();
                $scope.configureRankingsSummaryOptions();
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = $scope.selected.Property.name + ': %where%, ' + $scope.compIds.length + ' Comp(s), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.audit('report', 'Website');
                }

                // if ($scope.property_report) {
                //     $scope.graphs = 0;
                //     $scope.total = 3; // Map + NER + OCC
                //
                //     if ($rootScope.me.settings.showLeases) {
                //         $scope.total++;
                //     }
                //
                //     if ($scope.runSettings.profileSettings.graphs) {
                //         $scope.total += (3*($scope.compIds.length + 1));
                //     }
                //
                //
                //     $rootScope.$on('timeseriesLoaded', function (event,data) {
                //         // console.log('timesieres', (new Date()).getTime())
                //         $scope.graphs ++;
                //
                //         // console.log($scope.graphs, $scope.total);
                //
                //         if ($scope.graphs == $scope.total) {
                //
                //             window.renderable = true;
                //         }
                //     });
                // } else {

                    window.setTimeout(function () {
                        window.renderable = true;
                        // console.log('Render', (new Date()).getTime())
                    }, $scope.property_report ? 2500 : 300)
                // }


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
                settings: $scope.runSettings
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

            $scope.rankingsSummary = reportIds.indexOf("property_rankings_summary") > -1;
            $scope.rankings = reportIds.indexOf("property_rankings") > -1;
            $scope.property_report = reportIds.indexOf("property_report") > -1;

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
                selectedStartDate: $scope.liveSettings.dashboardSettings.daterange.selectedStartDate.format(),
                selectedEndDate: $scope.liveSettings.dashboardSettings.daterange.selectedEndDate.format(),
                selectedRange: $scope.liveSettings.dashboardSettings.daterange.selectedRange,
                progressId: $scope.progressId,
                compids: $scope.compIds
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = '/api/1.0/properties/' + $scope.selected.Property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key;

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.selected.Property._id, name: $scope.selected.Property.name}, description: $scope.selected.Property.name + ' - ' + $scope.liveSettings.dashboardSettings.daterange.selectedRange});

        }


        ////////////////////// Rankings Summary ////////////////////////////////
        $scope.resetRankingsSummarySettings = function(configure) {
            $scope.liveSettings.rankingsSummary = {orderBy: "nersqft"}

            $scope.configureRankingsSummaryOptions();
        }


        $scope.configureRankingsSummaryOptions = function() {
            if (!$scope.liveSettings.rankingsSummary) {
                return;
            }
            $scope.temp.rankingSummarySortItems = [
                {id: "name", name: "Name"},
                {id: "units", name: "Units"},
                {id: "unitpercent", name: "Unit %"},
                {id: "sqft", name: "Sqft"},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
            ]
            var f = $scope.liveSettings.rankingsSummary.orderBy.replace("-","");
            $scope.temp.rankingSummarySortSelected = _.find($scope.temp.rankingSummarySortItems, function(x) {return x.id == f})
            $scope.temp.rankingSummarySortDir = $scope.liveSettings.rankingsSummary.orderBy[0] == "-" ? "desc" : "asc";
        }

        $scope.$watch("runSettings.rankingsSummary.orderBy", function(newValue,oldValue) {
            if (oldValue && newValue) {
                var f = newValue.replace("-","");

                $scope.temp.rankingSummarySortSelected = _.find($scope.temp.rankingSummarySortItems, function(x) {return x.id == f})

                $scope.temp.rankingSummarySortDir = newValue[0] == "-" ? "desc" : "asc";

            }
        })

        ////////////////////// Rankings ////////////////////////////////
        $scope.resetRankingsSettings = function(configure) {

            $scope.liveSettings.rankings = {orderBy: "nersqft"}

            $scope.configureRankingsOptions();
        }


        $scope.configureRankingsOptions = function() {
            if (!$scope.liveSettings.rankings) {
                return;
            }
            $scope.temp.rankingSortItems = [
                {id: "name", name: "Name"},
                {id: "description", name: "Description"},
                {id: "units", name: "Units"},
                {id: "sqft", name: "Sqft"},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
            ]
            var f = $scope.liveSettings.rankings.orderBy.replace("-","");
            $scope.temp.rankingSortSelected = _.find($scope.temp.rankingSortItems, function(x) {return x.id == f})
            $scope.temp.rankingSortDir = $scope.liveSettings.rankings.orderBy[0] == "-" ? "desc" : "asc";
        }

        $scope.$watch("runSettings.rankings.orderBy", function(newValue,oldValue) {
            if (oldValue && newValue) {
                var f = newValue.replace("-","");

                $scope.temp.rankingSortSelected = _.find($scope.temp.rankingSortItems, function(x) {return x.id == f})

                $scope.temp.rankingSortDir = newValue[0] == "-" ? "desc" : "asc";

            }
        })


        ////////////////////// Property Report ////////////////////////////////

        $scope.configurePropertyReportOptions = function() {
            if (!$scope.liveSettings.showProfile) {
                return;
            }

            $scope.temp.showProfileOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showProfileItems = [
                {id: "address", name: "Address", selected: $scope.liveSettings.showProfile.address},

                {id: "website", name: "Website", selected: $scope.liveSettings.showProfile.website},
                {id: "phone", name: "Phone", selected: $scope.liveSettings.showProfile.phone},
                {id: "email", name: "Email", selected: $scope.liveSettings.showProfile.email},
                {id: "contact", name: "Contact", selected: $scope.liveSettings.showProfile.contact},
                {id: "const", name: "Construction", selected: $scope.liveSettings.showProfile.const},
                {id: "built", name: "Year Built", selected: $scope.liveSettings.showProfile.built},
                {id: "ren", name: "Year Renovated", selected: $scope.liveSettings.showProfile.ren},
                {id: "owner", name: "Owner", selected: $scope.liveSettings.showProfile.owner},
                {id: "mgmt", name: "Management", selected: $scope.liveSettings.showProfile.mgmt},
                {id: "units", name: "Total Units", selected: $scope.liveSettings.showProfile.units},
                {id: "occ", name: "Occupancy", selected: $scope.liveSettings.showProfile.occ},
                {id: "leased", name: "Leased", selected: $scope.liveSettings.showProfile.leased},
                {id: "renewal", name: "Renewal", selected: $scope.liveSettings.showProfile.renewal},
                {id: "traf", name: "Traffic / Week", selected: $scope.liveSettings.showProfile.traf},
                {id: "lease", name: "Leases / Week", selected: $scope.liveSettings.showProfile.lease},
            ];

            $scope.temp.showCompOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showCompItems = [
                {id: "occupancy", name: "Occupancy %", selected: $scope.liveSettings.dashboardSettings.show.occupancy},
                {id: "leased", name: "Leased %", selected: $scope.liveSettings.dashboardSettings.show.leased},
                {id: "renewal", name: "Renewal %", selected: $scope.liveSettings.dashboardSettings.show.renewal},
                {id: "weekly", name: "Traffic & Leases / Week", selected: $scope.liveSettings.dashboardSettings.show.weekly},
                {id: "units", name: "Units", selected: $scope.liveSettings.dashboardSettings.show.units},
                {id: "unitPercent", name: "Unit %", selected: $scope.liveSettings.dashboardSettings.show.unitPercent},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.dashboardSettings.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.dashboardSettings.show.rent},
                {id: "mersqft", name: "Rent / Sqft", selected: $scope.liveSettings.dashboardSettings.show.mersqft},
                {id: "concessions", name: "Concessions / 12 Months", selected: $scope.liveSettings.dashboardSettings.show.concessions},
                {id: "ner", name: "Net Effective Rent", selected: $scope.liveSettings.dashboardSettings.show.ner},
                {id: "nersqft", name: "Net Effective Rent / Sqft", selected: $scope.liveSettings.dashboardSettings.show.nersqft},
            ];

            $scope.temp.showFloorplanOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showFloorplanItems = [
                {id: "description", name: "Description", selected: $scope.liveSettings.profileSettings.show.description},
                {id: "units", name: "Units", selected: $scope.liveSettings.profileSettings.show.units},
                {id: "unitPercent", name: "Unit %", selected: $scope.liveSettings.profileSettings.show.unitPercent},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.profileSettings.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.profileSettings.show.rent},
                {id: "mersqft", name: "Rent / Sqft", selected: $scope.liveSettings.profileSettings.show.mersqft},
                {id: "concessions", name: "Concessions / 12 Months", selected: $scope.liveSettings.profileSettings.show.concessions},
                {id: "ner", name: "Net Effective Rent", selected: $scope.liveSettings.profileSettings.show.ner},
                {id: "nersqft", name: "Net Effective Rent / Sqft", selected: $scope.liveSettings.profileSettings.show.nersqft},
            ];

            $scope.temp.floorPlanSortItems = [
                {id: "description", name: "Description"},
                {id: "units", name: "Units"},
                {id: "unitPercent", name: "Unit %"},
                {id: "sqft", name: "Sqft"},
                {id: "rent", name: "Rent"},
                {id: "mersqft", name: "Rent/Sqft"},
                {id: "concessions", name: "Concess/12 Mos."},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
            ]
            var f = $scope.liveSettings.profileSettings.orderByFp.replace("-","");
            $scope.temp.floorPlanSortSelected = _.find($scope.temp.floorPlanSortItems, function(x) {return x.id == f})
            $scope.temp.floorPlanSortDir = $scope.liveSettings.profileSettings.orderByFp[0] == "-" ? "desc" : "asc";

            $scope.temp.compSortItems = [
                {id: "number", name: "Comp Preference"},
                {id: "name", name: "Name"},
                {id: "occupancy", name: "Occ. %"},
                {id: "leased", name: "Leased %"},
                {id: "renewal", name: "Renewal %"},
                {id: "weeklytraffic", name: "Traffic/Week"},
                {id: "weeklyleases", name: "Leases/Week"},
                {id: "units", name: "Units"},
                {id: "unitPercent", name: "Unit %"},
                {id: "sqft", name: "Sqft"},
                {id: "rent", name: "Rent"},
                {id: "mersqft", name: "Rent/Sqft"},
                {id: "concessions", name: "Concess/12 Mos."},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
            ]
            var f = $scope.liveSettings.dashboardSettings.orderByComp.replace("-","");
            $scope.temp.compSortSelected = _.find($scope.temp.compSortItems, function(x) {return x.id == f})
            $scope.temp.compSortDir = $scope.liveSettings.dashboardSettings.orderByComp[0] == "-" ? "desc" : "asc";

        }

        $scope.resetPropertyReportSettings = function(configure) {
            $scope.liveSettings.dashboardSettings = $reportingService.getDashboardSettings($rootScope.me, $(window).width());
            $scope.liveSettings.profileSettings = $reportingService.getProfileSettings($(window).width());
            $scope.liveSettings.showProfile = $reportingService.getInfoRows($rootScope.me);

            $scope.configurePropertyReportOptions();
        }

        // Watchers from Components
        $scope.$watch("runSettings.profileSettings.orderByFp", function(newValue,oldValue) {
            if (oldValue && newValue) {
                var f = newValue.replace("-","");

                $scope.temp.floorPlanSortSelected = _.find($scope.temp.floorPlanSortItems, function(x) {return x.id == f})

                $scope.temp.floorPlanSortDir = newValue[0] == "-" ? "desc" : "asc";

            }
        })

        $scope.$watch("runSettings.dashboardSettings.orderByComp", function(newValue,oldValue) {
            if (oldValue && newValue) {
                var f = newValue.replace("-","");

                $scope.temp.compSortSelected = _.find($scope.temp.compSortItems, function(x) {return x.id == f})

                $scope.temp.compSortDir = newValue[0] == "-" ? "desc" : "asc";

            }
        })

    }]);
});