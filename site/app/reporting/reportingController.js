'use strict';
define([
    'app'
], function (app) {

    app.controller('reportingController', ['$scope','$rootScope','$location','$propertyService','$auditService', 'ngProgress', '$progressService','$cookies','$window','toastr','$reportingService','$stateParams','$urlService','$uibModal','$saveReportService','$cookieSettingsService','$q'
        , function ($scope,$rootScope,$location,$propertyService,$auditService,ngProgress,$progressService,$cookies,$window,toastr,$reportingService,$stateParams,$urlService,$uibModal,$saveReportService,$cookieSettingsService,$q) {
        $scope.selected = {};
        $scope.reportIds = [];
        $scope.reportType = "";

        $rootScope.nav = "Reporting";
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Reporting";

        $scope.temp = {};
        $scope.liveSettings = {};
        $scope.runSettings = {};

        $scope.propertyOptions = { hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Properties", labelSelected: "Selected Properties", searchLabel: "Properties" }
        $scope.options = { hideSearch: true, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Comps", labelSelected: "Selected Comps", searchLabel: "Comps" }
        $scope.reportOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Reports", labelSelected: "Selected Reports", searchLabel: "Reports" }

        $scope.reportItems = []

        $scope.localLoading = false;

        $scope.meLoaded = false;
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                $scope.reportItems.push({id: "community_amenities", name: "Community Amenities", selected:false, group: "Individual Reports", type:"single", tooltip: "<b>Community Amenities Report</b> - <i>Report highlights all Community Amenities for the subject property and each comp property.</i>"});
                $scope.reportItems.push({id: "concession", name: "Concessions", selected:$stateParams.property == "2", group: "Individual Reports", type:"single", tooltip: "<b>Concessions Report</b> - <i>Report compares concessions over a customizable period of time for the subject property and comps. It includes Market Rent, One-Time Concessions, Recurring Concessions, Total Concessions, NER, and NER vs. Weighted Avg. Comp NER</i>"});
                $scope.reportItems.push({id: "fees_deposits", name: "Fees & Deposits", selected:false, group: "Individual Reports", type:"single", tooltip: "<b>Fees and Deposits Report</b> - <i>Report includes different fees and deposits for each property including: Administration Fee, Application Fee, Lease Terms, Pet Deposit (Refundable & Non-Refundable), Security Deposit, Pet Rent, and Short Term Rental Premium</i>"});
                $scope.reportItems.push({id: "location_amenities", name: "Location Amenities", selected:false, group: "Individual Reports", type:"single", tooltip: "<b>Location Amenities Report</b> - <i>Report highlights all Location Amenities for the subject property and each comp property.</i>"});
                $scope.reportItems.push({id: "property_report", name: "Market Survey Summary", selected:$stateParams.property == "1", group: "Individual Reports", type:"single", tooltip: "<b>Market Survey Summary</b> - <i>Report includes historic trends for key performance indicators including NER or NER/SQFT, Occupancy and Leased percentage in addition to property summaries for the subject property and each comps. The report allows users to benchmark the subject property vs. one or more comps and provides the ability to drill down by NER or NER/SQFT to the floor plan (bedroom) level for a customizable time-frame (ex: last 90 days.)</i>"});
                $scope.reportItems.push({id: "property_rankings_summary", name: "Floor Plan Comparison", selected:$stateParams.property == "3", group: "Individual Reports", type:"single", tooltip: "<b>Floor Plan Comparison</b> - <i>Report lets the user quickly sort, rank and analyze the current performance of the subject property versus each of the comps at the property and floor plan level</i>"});
                $scope.reportItems.push({id: "property_rankings", name: "Floor Plan Comparison (detailed)", selected:$stateParams.property == "4", group: "Individual Reports", type:"single", tooltip: "<b>Floor Plan Comparison (Detailed)</b> - <i>Similar to Floor Plan Comparison report, the \"detailed\" version includes the subject property and each comp and a detailed breakdown by individual floor plans as opposed to grouping by # of bedrooms.</i>"});

                    $scope.reportItems.push({
                        id: "trends",
                        name: "Trend Analysis",
                        selected: false,
                        group: "Individual Reports",
                        type: "single",
                        tooltip: "<b>Trend Analysis</b> - <i>Report allows comparison of data (Rent, NER, NER/SQFT, Occupancy, Leased %, Traffic & Leases, etc.) over two different time periods (ex: last 30 days vs. previous 30 days), as well as benchmarking against competitor data.</i>",
                    });
                $scope.reportItems.push({id: "property_status", name: "Property Status", selected: false, group: "Portfolio Reports", type:"multiple", tooltip: "<b>Property Status</b> - <i>Report is intended to give a focused summary on the current state of your portfolio. It can be modified to include data points such as Traffic & Leases, NER, and NER/SQFT as well as NER changes vs. {Last Week, Last Month, Last Year, or Comp Average}.</i>"});
                $scope.reportItems.push({id: "custom_portfolio", name: "Customizable Property Data", selected: false, group: "Portfolio Reports", type:"multiple", tooltip: "<b>Customizable Property Data</b> - <i>Report offers customizable solution to ad hoc building report tables with any property data available in BI:Radix. Allows modifying column order, setting sort preference, and exporting to Excel.</i>"});

                if ($cookies.get("settings")) {
                    $scope.liveSettings = JSON.parse($cookies.get("settings"));
                    $scope.fixDates();
                } else {
                    $scope.configureTrendsOptions();
                    $scope.configurePropertyReportOptions();
                    $scope.configureRankingsOptions();
                    $scope.configureRankingsSummaryOptions();
                    $scope.configureConcessionOptions();
                    $scope.configurePropertyStatusOptions();
                    $scope.configureCustomPortfolioOptions();
                }

                $scope.reload($stateParams.property == "1" || $stateParams.property == "2" || $stateParams.property == "3" || $stateParams.property == "4");

                if (!phantom) {
                    $scope.loadSaved();
                }

                $scope.meLoaded = true;

                me();
            }
        })

        $scope.loadReport = function(report) {

            $scope.currentReport = report;

            if (report.settings) {
                $scope.liveSettings = _.cloneDeep(report.settings);
            } else {
                $scope.liveSettings = {};
            }

            $scope.reportIds = _.cloneDeep(report.reportIds);

            $scope.reportType = report.type;

            $scope.reportItems.forEach(function(x,i) {
                $scope.reportItems[i].selected =$scope.reportIds.indexOf(x.id) > -1
            })

            $scope.fixDates();

            $scope.reportsChanged(true, function() {
                if ($scope.compIds && $scope.compIds.length) {
                    $scope.run();
                } else {
                    $scope.waitForComps = true;
                }
            });
        }

        $scope.fixDates = function() {
            for (var key in $scope.liveSettings) {
                if ($scope.liveSettings[key].daterange) {
                    $scope.liveSettings[key].daterange = $cookieSettingsService.defaultDateObject($scope.liveSettings[key].daterange.selectedRange,$scope.liveSettings[key].daterange.selectedStartDate,$scope.liveSettings[key].daterange.selectedEndDate)
                    $scope.liveSettings[key].daterange.reload = true;
                }

                if ($scope.liveSettings[key].daterange1) {
                    $scope.liveSettings[key].daterange1 = $scope.defaultTrendsDateRange1($scope.liveSettings[key].daterange1.selectedRange,$scope.liveSettings[key].daterange1.selectedStartDate,$scope.liveSettings[key].daterange1.selectedEndDate)
                    $scope.liveSettings[key].daterange1.reload = true;

                    $scope.liveSettings[key].daterange1.daterange2 = {
                        selectedRange: $scope.liveSettings[key].daterange2.selectedRange,
                        selectedStartDate: $scope.liveSettings[key].daterange2.selectedStartDate,
                        selectedEndDate: $scope.liveSettings[key].daterange2.selectedEndDate,
                        enabled: $scope.liveSettings[key].daterange2.enabled
                    }

                    $scope.updateTrendsDaterange2($scope.liveSettings[key].daterange1.selectedRange);
                }
            }
        }

        $scope.loadSaved = function() {
            $saveReportService.read().then(function (response) {
                    $scope.savedReports = response.data.reports;
                },
                function (error) {
                    toastr.error("Unable to load saved reports. Please contact the administrator.");
                });
        }

        $scope.autocompleteproperties = function(search,callback) {
            $propertyService.search({
                limit: 100,
                permission: ['PropertyManage'],
                active: true,
                searchName:search
                , skipAmenities: true
                , hideCustomComps: true
                , hideCustom: ($scope.reportType == "multiple") // no custom properties for group reports
                , select: "name comps.id custom"
                , sort: "name"
            }).then(function (response) {

                response.data.properties = _.sortBy(response.data.properties, function(x) {return x.name});
                response.data.properties.forEach(function(p) {
                    p.isCustom = !!(p.custom && p.custom.owner);

                    //For group reports and people with custom properties, add a group to multi dropdown
                    if ($rootScope.me.customPropertiesLimit > 0 && $scope.reportType == "multiple") {
                        p.group = $rootScope.me.orgs[0].name + " Properties"
                    }
                })

                if ($rootScope.me.customPropertiesLimit > 0 && $scope.reportType == "multiple") {
                    response.data.properties.push({id:0, name: "N/A For This Report", group : " My Custom Properties", disabled: true  })
                }


                callback(response.data.properties)
            }, function (error) {
                callback([]);
            })

        }

        $scope.reload = function(bRun) {
            $scope.propertyItems = {items: []};

            // For Printing
            if ($cookies.get("transaction_id")) {
                $scope.transaction_id = $cookies.get("transaction_id");
            }
            if ($cookies.get("reportIds")) {
                if (!_.isArray($cookies.get("reportIds"))) {
                    $scope.reportIds = $cookies.get("reportIds").split(",");
                } else {
                    $scope.reportIds = $cookies.get("reportIds");
                }

                $scope.reportItems.forEach(function (x, i) {
                    $scope.reportItems[i].selected = $scope.reportIds.indexOf(x.id) > -1
                })

                if (!_.isArray($cookies.get("propertyIds"))) {
                    $scope.propertyIds = $cookies.get("propertyIds").split(",");
                } else {
                    $scope.propertyIds = $cookies.get("propertyIds");
                }

                if ($cookies.get("type")) {
                    $scope.reportType = $cookies.get("type");
                }

                // $scope.debug = {r: $scope.reportIds,t: $scope.reportType, p: $scope.propertyIds, i: $scope.propertyItems};
                // window.renderable = true;


                $propertyService.search({
                    limit: 10000,
                    permission: 'PropertyManage',
                    select: "_id name comps.id comps.orderNumber custom",
                    ids: $scope.propertyIds,
                    hideCustomComps: true,
                    sort: "name"
                    ,
                    skipAmenities: true
                }).then(function (response) {

                    response.data.properties.forEach(function(p) {
                        p.isCustom = !!(p.custom && p.custom.owner);
                    })

                    if ($scope.reportType == 'single') {
                        $scope.selected.Property = response.data.properties[0];
                    } else {
                        var item;
                        response.data.properties.forEach(function (p) {
                            item = {id: p._id, name: p.name};
                            $scope.propertyItems.items.push(item);
                        })

                        $scope.run();
                    }
                });
            }

            window.setTimeout(function() {
                window.document.title = "Reporting | BI:Radix";
            }, 1500);
            $scope.localLoading = true;
        }

        $scope.loadSingle = function(callback) {
            $propertyService.search({
                limit: 2,
                permission: "PropertyManage",
                hideCustomComps: true,
                active: true,
                select: "_id name comps.id comps.orderNumber custom",
                skipAmenities: true,
            }).then(function(response) {
                response.data.properties.forEach(function(p) {
                    p.isCustom = !!(p.custom && p.custom.owner);
                })
                $scope.myProperties = response.data.properties;

                var id = $rootScope.me.settings.defaultPropertyId;

                if ($cookies.get("subjectId")) {
                    id = $cookies.get("subjectId");
                }

                if (!$scope.myProperties || $scope.myProperties.length == 0) {
                    id = null;
                } else if (!id) {
                    $scope.selected.Property = $scope.myProperties[0];
                } else {
                    $scope.selected.Property = _.find($scope.myProperties, function (x) {
                        return x._id.toString() == id;
                    })

                    if (!$scope.selected.Property) {
                        $propertyService.search({
                            limit: 1,
                            _id: id,
                            permission: "PropertyManage",
                            active: true,
                            select: "_id name comps.id comps.orderNumber custom",
                            skipAmenities: true,
                        }).then(function(response) {
                            if (response.data.properties.length == 0) {
                                $scope.selected.Property = $scope.myProperties[0];
                            } else {
                                response.data.properties.forEach(function (p) {
                                    p.isCustom = !!(p.custom && p.custom.owner);
                                })
                                $scope.selected.Property = response.data.properties[0];
                                $scope.myProperties.push($scope.selected.Property);
                                $scope.myProperties = _.sortBy($scope.myProperties, function (x) {
                                    return x.name;
                                });
                            }
                            callback();
                        });

                        return;
                    }
                }

                callback();
            });
        }

        $scope.searchAsync = function (term) {

            var deferred = $q.defer();

            $scope.autocompleteproperties(term, function(result) {
                result = _.sortByOrder(result, ["isCustom","name"], [false, true]);
                var found = {};
                result.forEach(function(r) {
                    if (r.isCustom) {
                        if (!found["My Custom Properties"]) {
                            r.group = "My Custom Properties";
                            found["My Custom Properties"] = true;
                        }
                    } else {
                        if (!found[$rootScope.me.orgs[0].name + " Properties"]) {
                            r.group = $rootScope.me.orgs[0].name + " Properties";
                            found[$rootScope.me.orgs[0].name + " Properties"] = true;
                        }
                    }
                })
                deferred.resolve(result);
            })

            return deferred.promise;
        };

        $scope.loadComps = function() {
            var compids = _.pluck($scope.selected.Property.comps,"id");
            var subjectid = $scope.selected.Property._id;

            if ($cookies.get("compIds")) {
                if (!_.isArray($cookies.get("compIds"))) {
                    compids = $cookies.get("compIds").split(",");
                } else {
                    compids = $cookies.get("compIds");
                }
            }

            window.setTimeout(function() {window.document.title = $scope.selected.Property.name + " - Reporting | BI:Radix";},1500);
            $scope.reportLoading = false;
            $scope.noReports = false;
            delete $scope.reports;

            $propertyService.search({
                limit: 10000, permission: 'PropertyView', active: true, select : "_id name address", ids: compids, sort: "name"
                , skipAmenities: true
            }).then(function (response) {
                $scope.temp.items = [];

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
                        $scope.temp.items.push({id: c._id, name: c.name, selected: true, address: c.address});
                    }
                })
                $scope.localLoading = true;

                if ($cookies.get("reportIds") || $scope.waitForComps === true) {
                    delete $scope.waitForComps;
                    $scope.run();
                }
            });
        };

        $scope.changeProperty = function() {
            $scope.loadComps();
        }

        $scope.checkReportRunning = function() {
            if (!$scope.reportStarted) {
                return;
            }

            var seconds = ((new Date()).getTime() - $scope.reportStarted.getTime()) / 1000;

            if (seconds > 90) {
                toastr.error("Sorry! We appear to be having difficulties generating your report. Please try to run the report again and if you continue see this message contact support@biradix.com", null, {timeOut: 60000});
                delete $scope.reportStarted;
                $scope.reportLoading = false;
                window.renderable = true;
                Raygun.send(new Error("Report took longer then 90 seconds"));
                return;
            }

            window.setTimeout(function() {
                $scope.checkReportRunning();
            }, 1000);
        };

        $scope.run = function() {
            $scope.reports = null;
            $scope.reportLoading = true;
            $scope.noReports = false;
            $scope.noProperties = false;

            $scope.reportNamesChanged();

            if ($scope.reportIds.length == 0) {
                $scope.noReports = true;
                $scope.reportLoading = false;
                window.renderable = true;
                return;
            }
            $scope.reportStarted = new Date();
            $scope.checkReportRunning();

            if ($scope.currentReport && $scope.currentReport.name.toLowerCase() === "crash me" && $rootScope.me.email.toLowerCase().indexOf("biradix.com") > -1) {
               throw new Error("Reports crash testing on purpose");
            }

            if ($scope.reportType == "single") {
                $scope.coverPage = {
                    date: moment().format("MMM Do, YYYY"),
                    isCustom: $scope.selected.Property.custom && $scope.selected.Property.custom.owner,
                    reports: [{name: $scope.selected.Property.name, items : $scope.reportNames2}],
                    org: $rootScope.me.orgs[0]
                }

                $scope.singleReport();
            } else {
                var properties =  _.pluck($scope.propertyItems.items, "name");
                var reports = [];

                $scope.reportNames2.forEach(function(r) {
                    reports.push({name:r, items : properties})
                })

                $scope.coverPage = {
                    date: moment().format("MMM Do, YYYY"),
                    reports: reports,
                    org: $rootScope.me.orgs[0]
                }

                $scope.multipleReport();
            }
        };

        $scope.multipleReport = function() {
            var properties = $scope.propertyItems.items;

            if (!properties.length) {
                $scope.noProperties = true;
                $scope.reportLoading = false;
                return;
            }

            $scope.UItoSettingsMultiple();

            $scope.propertyNames =  _.pluck(properties,"name")
            $scope.propertyNames.forEach(function(x,i) {$scope.propertyNames[i] = {description: 'Property: ' + x}});
            $scope.propertyIds =  _.pluck(properties,"id")

            $scope.runSettings = _.cloneDeep($scope.liveSettings);

            $reportingService.reportsGroup($scope.propertyIds,$scope.reportIds, $saveReportService.cleanSettings($scope.runSettings, $scope.reportIds)).then(function(response) {

                $scope.configurePropertyStatusOptions();
                $scope.configureCustomPortfolioOptions();

                $scope.reportLoading = false;
                $scope.reports = response.data;

                if ($scope.reports.custom_portfolio) {
                    var bedrooms = {};
                    $scope.reports.custom_portfolio.forEach(function(gr) {
                        var avgRow = gr[gr.length - 1];
                        for (var i = 0; i<=6; i++) {
                            if (typeof avgRow["rent" + i + "Units"] !== "undefined" && avgRow["rent" + i + "Units"] > 0) {
                                bedrooms[i] = true;
                            }
                        }
                    });

                    $scope.liveSettings.customPortfolio.bedrooms = bedrooms;
                    $scope.runSettings.customPortfolio.bedrooms = bedrooms;
                }

                $scope.description = '%where%, ' + $scope.propertyNames.length + ' Property(ies), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.auditMultiple('report', 'Website');
                }

                delete $scope.reportStarted;

                window.setTimeout(function() {
                    window.renderable = true;
                }, 200);
            });

        }

        $scope.UItoSettings = function() {
            if (phantom) {
                return;
            }
            if ($scope.reportIds.indexOf("property_report") > -1) {
                $scope.liveSettings.dashboardSettings.selectedBedroom = $scope.temp.bedroom.value;
                $scope.liveSettings.showProfile = {};

                $scope.temp.showProfileItems.forEach(function (f) {
                    $scope.liveSettings.showProfile[f.id] = f.selected;
                })

                $scope.temp.showCompItems.forEach(function (f) {
                    $scope.liveSettings.dashboardSettings.show[f.id] = f.selected;
                })

                $scope.temp.showFloorplanItems.forEach(function (f) {
                    $scope.liveSettings.profileSettings.show[f.id] = f.selected;
                })

                $scope.liveSettings.profileSettings.orderByFp = ($scope.temp.floorPlanSortDir == "desc" ? "-" : "") + $scope.temp.floorPlanSortSelected.id;

                if (!$scope.temp.compSortSelected) {
                    $scope.liveSettings.dashboardSettings.orderByComp = "number";
                } else {
                    $scope.liveSettings.dashboardSettings.orderByComp = (($scope.temp.compSortDir == "desc" && $scope.temp.compSortSelected.id != "number") ? "-" : "") + $scope.temp.compSortSelected.id;
                }
            }

            if ($scope.reportIds.indexOf("property_rankings") > -1) {
                if ($scope.temp.rankingSortSelected) {
                    $scope.liveSettings.rankings.orderBy = ($scope.temp.rankingSortDir == "desc" ? "-" : "") + $scope.temp.rankingSortSelected.id;
                }

                $scope.temp.showRankingsItems.forEach(function (f) {
                    $scope.liveSettings.rankings.show[f.id] = f.selected;
                })
            }

            if ($scope.reportIds.indexOf("property_rankings_summary") > -1) {
                if ($scope.temp.rankingSummarySortSelected) {
                    $scope.liveSettings.rankingsSummary.orderBy = ($scope.temp.rankingSummarySortDir == "desc" ? "-" : "") + $scope.temp.rankingSummarySortSelected.id;
                }

                $scope.temp.showRankingsSummaryItems.forEach(function (f) {
                    $scope.liveSettings.rankingsSummary.show[f.id] = f.selected;
                })
            }

            if ($scope.reportIds.indexOf("trends") > -1) {
                $scope.temp.showTrendsItems.forEach(function (f) {
                    $scope.liveSettings.trends.show[f.id] = f.selected;
                })
            }

        }

        $scope.UItoSettingsMultiple = function() {
            if (phantom) {
                return;
            }

            if ($scope.reportIds.indexOf("property_status") > -1) {
                $scope.temp.showPropertyStatusItems.forEach(function (f) {
                    $scope.liveSettings.propertyStatus.show[f.id] = f.selected;
                });
            }

            if ($scope.reportIds.indexOf("custom_portfolio") > -1) {
                $scope.temp.showCustomPortfolioItems.forEach(function (f) {
                    $scope.liveSettings.customPortfolio.show[f.id] = f.selected;
                });

                if ($scope.temp.customPortfolioSortSelected) {
                    $scope.liveSettings.customPortfolio.orderBy = ($scope.temp.customPortfolioSortDir == "desc" ? "-" : "") + $scope.temp.customPortfolioSortSelected.id;
                }
            }
        };

        $scope.singleReport = function() {
            $scope.selected.Comps = _.filter($scope.temp.items,function(x) {return x.selected == true})
            $scope.compIds =  _.pluck($scope.selected.Comps,"id")
            $scope.compNames =  _.pluck($scope.selected.Comps,"name")
            $scope.compNames.forEach(function(x,i) {$scope.compNames[i] = {description: 'Comp: ' + x}});

            var options = {};

            $scope.UItoSettings();

            $scope.runSettings = _.cloneDeep($scope.liveSettings);
            $scope.cleanSettings = $saveReportService.cleanSettings($scope.runSettings, $scope.reportIds);

            if ($scope.reportIds.indexOf("property_report") > -1) {
                options.property_report = {
                    summary: $scope.cleanSettings.dashboardSettings.summary,
                    bedrooms: $scope.cleanSettings.dashboardSettings.selectedBedroom,
                    daterange: {
                        daterange: $scope.cleanSettings.dashboardSettings.daterange.selectedRange,
                        start: $scope.cleanSettings.dashboardSettings.daterange.selectedStartDate,
                        end: $scope.cleanSettings.dashboardSettings.daterange.selectedEndDate
                    },
                    show: {
                        graphs: $scope.cleanSettings.profileSettings.graphs
                        , scale: $scope.cleanSettings.dashboardSettings.nerScale
                    },
                    offset: moment().utcOffset(),
                    transaction_id: $scope.transaction_id,
                }
            }

            if ($scope.reportIds.indexOf("concession") > -1) {
                options.concession = {
                    daterange: {
                        daterange: $scope.cleanSettings.concession.daterange.selectedRange,
                        start: $scope.cleanSettings.concession.daterange.selectedStartDate,
                        end: $scope.cleanSettings.concession.daterange.selectedEndDate
                    },
                    offset: moment().utcOffset()
                }
            }

            if ($scope.reportIds.indexOf("trends") > -1) {
                options.trends = {
                    daterange1: {
                        daterange: $scope.cleanSettings.trends.daterange1.selectedRange,
                        start: $scope.cleanSettings.trends.daterange1.selectedStartDate,
                        end: $scope.cleanSettings.trends.daterange1.selectedEndDate
                    },
                    daterange2: {
                        daterange: $scope.cleanSettings.trends.daterange2.selectedRange,
                        start: $scope.cleanSettings.trends.daterange2.selectedStartDate,
                        end: $scope.cleanSettings.trends.daterange2.selectedEndDate,
                        enabled: $scope.cleanSettings.trends.daterange2.enabled
                    },
                    offset: moment().utcOffset(),
                    show: $scope.cleanSettings.trends.show,
                    graphs: $scope.cleanSettings.trends.graphs
                }

            }


            $reportingService.reports(
                $scope.compIds
                ,$scope.selected.Property._id
                ,$scope.reportIds
                ,options
            ).then(function(response) {
                //Run these after the reports are ran
                $scope.configureTrendsOptions();
                $scope.configurePropertyReportOptions();
                $scope.configureRankingsOptions();
                $scope.configureRankingsSummaryOptions();
                $scope.configureConcessionOptions();
                $scope.reportLoading = false;
                $scope.reports = response.data;

                $scope.description = $scope.selected.Property.name + ': %where%, ' + $scope.compIds.length + ' Comp(s), ' + $scope.reportIds.length + ' Report Type(s)';

                if (!phantom) {
                    $scope.audit('report', 'Website');
                }

                delete $scope.reportStarted;

                if ($scope.property_report) {
                    $scope.graphs = 0;
                    $scope.total = 3; // Map + NER + OCC

                    if ($rootScope.me.settings.showLeases) {
                        $scope.total++;
                    }

                    if ($scope.runSettings.profileSettings.graphs) {
                        $scope.total += (3*($scope.compIds.length + 1));
                    }

                    $rootScope.$on('timeseriesLoaded', function (event,data) {
                        // console.log('timesieres', (new Date()).getTime())
                        $scope.graphs ++;

                        //console.log($scope.graphs, $scope.total,(new Date()).getTime());

                        if ($scope.graphs == $scope.total) {
                            window.setTimeout(function () {
                                window.renderable = true;
                            }, 600)
                        }
                    });
                } else {
                    window.setTimeout(function () {
                        window.renderable = true;
                        // console.log('Render', (new Date()).getTime())
                    }, $scope.trends ? 2000 :  300);
                }
            });
        };

        $scope.pdf = function(showFile) {
            if ($scope.property_report) {
                var c = 0;
                var n;
                for (n in $scope.runSettings.dashboardSettings.show){

                    if ($scope.runSettings.dashboardSettings.show[n] === true) {
                        c++;
                    }
                }

                if (c > 13) {
                    toastr.error("<B>Unable to Print/Export Report!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in Print/Export.")

                    return;
                }
            }

            if ($scope.property_status) {
                var c = 0;
                var n;
                for (n in $scope.runSettings.propertyStatus.show) {

                    if ($scope.runSettings.propertyStatus.show[n] === true) {
                        c++;
                    }
                }

                if (c > 13) {
                    toastr.error("<B>Unable to Print/Export Report!</B><Br><Br>You have selected <b>" + c + "</b> columns for your Property Status report. Having over <u>13</u> columns will not fit in Print/Export.")

                    return;
                }
            }

            if ($scope.custom_portfolio) {
                var c = 0;
                var n;
                for (n in $scope.runSettings.customPortfolio.show) {

                    if ($scope.runSettings.customPortfolio.show[n] === true) {
                        c++;
                    }
                }

                if (c > 13) {
                    toastr.error("<B>Unable to Print/Export Report!</B><Br><Br>You have selected <b>" + c + "</b> columns for your Customizable Property Data report. Having over <u>13</u> columns will not fit in Print/Export.")

                    return;
                }
            }

            var auditType = "report_print";

            if (showFile) {
                auditType = "report_pdf";
            }

            if ($scope.reportType == "single") {
                $scope.audit(auditType, "Pdf");
            } else {
                $scope.auditMultiple(auditType, "Pdf");
            }

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                compIds:  encodeURIComponent($scope.compIds),
                reportIds:  encodeURIComponent($scope.reportIds),
                progressId: $scope.progressId,
                timezone: moment().utcOffset(),
                type: $scope.reportType,
                propertyIds:  encodeURIComponent($scope.propertyIds),
                showFile: showFile,
                settings: $saveReportService.cleanSettings($scope.runSettings, $scope.reportIds),
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = '/api/1.0/properties/reportsPdf?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key

            $.get( url, function( data ) {
                window.setTimeout(
                    function() {
                        $scope.checkProgressNew(showFile);
                    }, 500
                );
            });

            ngProgress.start();

            $("#export").prop("disabled", true);
        };

        $scope.checkProgressNew = function(showFile) {
                $progressService.isComplete($scope.progressId, function(isComplete) {
                    if (isComplete) {
                        ngProgress.complete();
                        $("#export").prop("disabled", false);

                        var url = "/api/1.0/properties/downloadPdf?"
                        url += "token=" + $cookies.get("token")
                        url += "&id=" + $scope.progressId;

                        // if (showFile === true) {
                            location.href = url;
                        // } else {
                        //     window.open(url);
                        // }
                    } else {
                        window.setTimeout(
                            function() {
                                $scope.checkProgressNew(showFile);
                            }, 500
                        );
                    }
                });
            };
        $scope.checkProgress = function() {
            $progressService.isComplete($scope.progressId, function(isComplete) {
                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    $window.setTimeout($scope.checkProgress, 500);
                }
            });
        };

        $scope.audit = function(type, where) {
            var data =$scope.compNames.concat($scope.reportNames);

            if ($scope.currentReport) {
                data.unshift({description: 'Saved Report: ' + $scope.currentReport.name})
            }

            if (where == "Pdf") {
                $auditService.create({type: type, property: $scope.selected.Property, description: $scope.description.replace('%where%', where), data: data});
            } else {
                $auditService.create({type: 'report', property: $scope.selected.Property, description: $scope.description.replace('%where%',where), data: data});
            }
        }

        $scope.auditMultiple = function(type, where) {

            var data = $scope.propertyNames.concat($scope.reportNames);

            if ($scope.currentReport) {
                data.unshift({description: 'Saved Report: ' + $scope.currentReport.name})
            }

            if (where == "Pdf") {
                $auditService.create({
                    type: type,
                    description: $scope.description.replace('%where%', where),
                    data: data,
                });
            } else {
                $auditService.create({
                    type: 'report',
                    description: $scope.description.replace('%where%', where),
                    data: data,
                });
            }
        }
        $scope.$watch('reportItems', function() {
            $scope.reports = null;
            $scope.reportsChanged();
            $scope.reportNamesChanged();

        },true)

        $scope.$watch('selected.Property', function() {
            if ($scope.selected.Property) {
                $scope.propertyIds = [$scope.selected.Property._id];
                $scope.changeProperty();
            }
        }, true);


        $scope.reportNamesChanged = function() {
            $scope.reportNames = _.pluck(_.filter($scope.reportItems,function(x) {return x.selected == true}),"name");
            $scope.reportNames2 = _.clone($scope.reportNames);
            $scope.reportNames.forEach(function(x,i) {$scope.reportNames[i] = {description: 'Report: ' + x}});
        }

        $scope.reportsChanged = function(load, callback) {
            if (!$rootScope.me) {
                return;
            }

            $scope.configureTrendsOptions();
            $scope.configurePropertyReportOptions();
            $scope.configureRankingsOptions();
            $scope.configureRankingsSummaryOptions();
            $scope.configureConcessionOptions();
            $scope.configurePropertyStatusOptions();
            $scope.configureCustomPortfolioOptions();

            var reportIds = _.pluck(_.filter($scope.reportItems,function(x) {return x.selected == true}),"id");

            if (!$scope.property_report && reportIds.indexOf("property_report") > -1) {
                $scope.temp.bedrooms = [
                    {value: -1, text: 'Average'}
                    ,{value: -2, text: 'All'}
                    ,{value: 0, text: 'Studios'}
                    ,{value: 1, text: '1 Bdrs.'}
                    ,{value: 2, text: '2 Bdrs.'}
                    ,{value: 3, text: '3 Bdrs.'}
                    ,{value: 4, text: '4 Bdrs.'}
                ]

                $scope.temp.bedroom = _.find($scope.temp.bedrooms, function(x) {return x.value == $scope.liveSettings.dashboardSettings.selectedBedroom});

                if (!$scope.temp.bedroom) {
                    $scope.temp.bedroom = $scope.temp.bedrooms[0];
                }
            }


            $scope.property_status = reportIds.indexOf("property_status") > -1;
            $scope.custom_portfolio = reportIds.indexOf("custom_portfolio") > -1;
            $scope.rankingsSummary = reportIds.indexOf("property_rankings_summary") > -1;
            $scope.rankings = reportIds.indexOf("property_rankings") > -1;
            $scope.property_report = reportIds.indexOf("property_report") > -1;
            $scope.concession = reportIds.indexOf("concession") > -1;
            $scope.trends = reportIds.indexOf("trends") > -1;



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

            if (load || ($scope.reportType == "single" && oldReportType != $scope.reportType)) {
                $scope.loadSingle(function() {
                    if (callback) {
                        callback();
                    }
                });
            } else {
                if (callback) {
                    callback();
                }
            }
        }

        $scope.excel_property_status = function(settings) {
            var properties = $scope.propertyItems.items;

            if (!properties.length) {
                $scope.noProperties = true;
                $scope.reportLoading = false;
                return;
            }

            $scope.propertyNames = _.pluck(properties, "name");
            $scope.propertyNames.forEach(function(x, i) {
                $scope.propertyNames[i] = {description: "Property: " + x};
            });

            $scope.description = "%where%, " + $scope.propertyNames.length + " Property(ies), " + $scope.reportIds.length + " Report Type(s)";
            $scope.auditMultiple("report", "Excel");

            ngProgress.start();

            $("#export").prop("disabled", true);

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                timezone: moment().utcOffset(),
                propertyIds: $scope.propertyIds,
                progressId: $scope.progressId,
                settings: $scope.runSettings.propertyStatus,
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = "/api/1.0/reporting/excel/property_status?"
            url += "token=" + $cookies.get("token")
            url += "&key=" + key;

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;
        };

            $scope.excel_custom_portfolio = function(settings) {
                var properties = $scope.propertyItems.items;

                if (!properties.length) {
                    $scope.noProperties = true;
                    $scope.reportLoading = false;
                    return;
                }

                $scope.propertyNames = _.pluck(properties, "name");
                $scope.propertyNames.forEach(function(x, i) {
                    $scope.propertyNames[i] = {description: "Property: " + x};
                });

                $scope.description = "%where%, " + $scope.propertyNames.length + " Property(ies), " + $scope.reportIds.length + " Report Type(s)";
                $scope.auditMultiple("report", "Excel");

                ngProgress.start();

                $("#export").prop("disabled", true);

                $scope.progressId = _.random(1000000, 9999999);

                var data = {
                    timezone: moment().utcOffset(),
                    propertyIds: $scope.propertyIds,
                    progressId: $scope.progressId,
                    settings: $scope.runSettings.customPortfolio,
                }

                var key = $urlService.shorten(JSON.stringify(data));

                var url = "/api/1.0/reporting/excel/custom_portfolio?"
                url += "token=" + $cookies.get("token")
                url += "&key=" + key;

                $window.setTimeout($scope.checkProgress, 500);

                location.href = url;
            };

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
                compids: $scope.compIds,
            }

            var key = $urlService.shorten(JSON.stringify(data));

            var url = '/api/1.0/properties/' + $scope.selected.Property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&key=" + key;

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.selected.Property._id, name: $scope.selected.Property.name}, description: $scope.selected.Property.name + ' - ' + $scope.liveSettings.dashboardSettings.daterange.selectedRange});

        }

        ////////////////////// Property Status ////////////////////////////////
        $scope.resetPropertyStatusSettings = function() {
            $scope.liveSettings.propertyStatus = {}

            $scope.liveSettings.propertyStatus.show = {
                occupancy: true,
                leased: $rootScope.me.settings.showLeases || false,
                atr: $rootScope.me.settings.showATR || false,
                units: true,
                sqft: true,
                rent: true,
                runrate: false,
                runratesqft: false,
                ner: true,
                nerweek: true,
                nermonth: true,
                neryear: false,                
                nersqft: true,
                nersqftweek: false,
                nersqftmonth: false,
                nersqftyear: false,
                last_updated: true,
                weekly: false,
                concessions: false,
                nervscompavg: false,
            }
        }

        $scope.configurePropertyStatusOptions = function() {
            if (!$scope.liveSettings.propertyStatus) {
                $scope.resetPropertyStatusSettings();
            }

            $scope.temp.showPropertyStatusOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showPropertyStatusItems = [
                {id: "occupancy", name: "Occ. %", selected: $scope.liveSettings.propertyStatus.show.occupancy},
                {id: "leased", name: "Leased %", selected: $scope.liveSettings.propertyStatus.show.leased || false},
                {id: "atr", name: "ATR %", selected: $scope.liveSettings.propertyStatus.show.atr || false},
                {id: "weekly", name: "Traffic & Leases / Week", selected: $scope.liveSettings.propertyStatus.show.weekly},
                {id: "units", name: "Units", selected: $scope.liveSettings.propertyStatus.show.units},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.propertyStatus.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.propertyStatus.show.rent},
                {id: "concessions", name: "Total Concession", selected: $scope.liveSettings.propertyStatus.show.concessions},
                {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.propertyStatus.show.runrate},
                {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.propertyStatus.show.runratesqft},
                {id: "ner", name: "Net Eff. Rent", selected: $scope.liveSettings.propertyStatus.show.ner},
                {id: "nerweek", name: "NER vs Last Week", selected: $scope.liveSettings.propertyStatus.show.nerweek},
                {id: "nermonth", name: "NER vs Last Month", selected: $scope.liveSettings.propertyStatus.show.nermonth},
                {id: "neryear", name: "NER vs Last Year", selected: $scope.liveSettings.propertyStatus.show.neryear},
                {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: $scope.liveSettings.propertyStatus.show.nersqft},
                {id: "nersqftweek", name: "NER/Sqft vs Last Week", selected: $scope.liveSettings.propertyStatus.show.nersqftweek},
                {id: "nersqftmonth", name: "NER/Sqft vs Last Month", selected: $scope.liveSettings.propertyStatus.show.nersqftmonth},
                {id: "nersqftyear", name: "NER/Sqft vs Last Year", selected: $scope.liveSettings.propertyStatus.show.nersqftyear},
                {id: "nervscompavg", name: "NER vs Comp Avg", selected: $scope.liveSettings.propertyStatus.show.nervscompavg},
                {id: "last_updated", name: "Last Updated", selected: $scope.liveSettings.propertyStatus.show.last_updated},
            ];

            if (!$rootScope.me.settings.showLeases) {
                _.remove($scope.temp.showPropertyStatusItems, function(x) {return x.id == 'leased'})
            }

            if (!$rootScope.me.settings.showATR) {
                _.remove($scope.temp.showPropertyStatusItems, function(x) {return x.id == 'atr'})
            }

        }

            ////////////////////// Custom Portfolio ////////////////////////////////
            $scope.resetCustomPortfolioSettings = function() {
                $scope.liveSettings.customPortfolio = {orderBy: "default"};

                $scope.liveSettings.customPortfolio.show = {
                    address: false,
                    walkscore: false,
                    transitscore: false,
                    bikescore: false,
                    phone: false,
                    yearBuilt: false,
                    constructionType: false,
                    owner: false,
                    management: false,
                    occupancy: true,
                    leased: $rootScope.me.settings.showLeases || false,
                    renewal: false,
                    atr: false,
                    units: true,
                    sqft: true,
                    rent: true,
                    rentsqft: false,
                    runrate: false,
                    runratesqft: false,
                    ner: true,
                    nerweek: false,
                    nermonth: false,
                    neryear: false,
                    nersqft: true,
                    nersqftweek: false,
                    nersqftmonth: false,
                    nersqftyear: false,
                    last_updated: true,
                    weekly: false,
                    concessions: true,
                    concessionsMonthly: false,
                    concessionsOneTime: false,
                    nervscompavg: false,
                    nersqftvscompavg: false,
                    rent0: false,
                    rent1: false,
                    rent2: false,
                    rent3: false,
                    ner0: false,
                    ner1: false,
                    ner2: false,
                    ner3: false,
                };

                $scope.liveSettings.customPortfolio.compAverages = false;
                $scope.liveSettings.customPortfolio.defaultOrder = true;
            }

            $scope.configureCustomPortfolioOptions = function() {
                if (!$rootScope) {
                    return;
                }

                if (!$scope.liveSettings.customPortfolio) {
                    $scope.resetCustomPortfolioSettings();
                }

                $scope.temp.showCustomPortfolioOptions = { hideSearch: true, dropdown: true, dropdownDirection: "left", labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
                $scope.temp.showCustomPortfolioItems = [
                    {id: "address", name: "Address", selected: $scope.liveSettings.customPortfolio.show.address, tooltip: $rootScope.tooltips["address"]},
                    {id: "walkscore", name: "Walk Score® - Walk Score", selected: $scope.liveSettings.customPortfolio.show.walkscore, tooltip: $rootScope.tooltips["walkscore"]},
                    {id: "transitscore", name: "Walk Score® - Transit Score", selected: $scope.liveSettings.customPortfolio.show.transitscore, tooltip: $rootScope.tooltips["transitscore"]},
                    {id: "bikescore", name: "Walk Score® - Bike Score", selected: $scope.liveSettings.customPortfolio.show.bikescore, tooltip: $rootScope.tooltips["bikescore"]},
                    {id: "phone", name: "Phone", selected: $scope.liveSettings.customPortfolio.show.phone, tooltip: $rootScope.tooltips["phone"]},
                    {id: "constructionType", name: "Construction", selected: $scope.liveSettings.customPortfolio.show.constructionType, tooltip: $rootScope.tooltips["constructionType"]},
                    {id: "owner", name: "Owner", selected: $scope.liveSettings.customPortfolio.show.owner, tooltip: $rootScope.tooltips["owner"]},
                    {id: "management", name: "Management", selected: $scope.liveSettings.customPortfolio.show.management, tooltip: $rootScope.tooltips["management"]},
                    {id: "yearBuilt", name: "Year Built", selected: $scope.liveSettings.customPortfolio.show.yearBuilt, tooltip: $rootScope.tooltips["yearBuilt"]},
                    {id: "units", name: "Units", selected: $scope.liveSettings.customPortfolio.show.units, tooltip: $rootScope.tooltips["units"]},
                    {id: "sqft", name: "Sqft", selected: $scope.liveSettings.customPortfolio.show.sqft, tooltip: $rootScope.tooltips["sqft"]},
                    {id: "occupancy", name: "Occ. %", selected: $scope.liveSettings.customPortfolio.show.occupancy, tooltip: $rootScope.tooltips["occupancy"]},
                    {id: "leased", name: "Leased %", selected: $scope.liveSettings.customPortfolio.show.leased || false, tooltip: $rootScope.tooltips["leased"]},
                    {id: "renewal", name: "Renewal %", selected: $scope.liveSettings.customPortfolio.show.renewal || false, tooltip: $rootScope.tooltips["renewal"]},
                    {id: "atr", name: "ATR %", selected: $scope.liveSettings.customPortfolio.show.atr || false, tooltip: $rootScope.tooltips["atr"]},
                    {id: "weekly", name: "Traffic & Leases / Week", selected: $scope.liveSettings.customPortfolio.show.weekly, tooltip: $rootScope.tooltips["weeklytraffic"] + "<Br><Br>" + $rootScope.tooltips["weeklyleases"]},
                    {id: "rent", name: "Rent", selected: $scope.liveSettings.customPortfolio.show.rent, tooltip: $rootScope.tooltips["rent"]},
                    {id: "rentsqft", name: "Rent/Sqft", selected: $scope.liveSettings.customPortfolio.show.rentsqft, tooltip: $rootScope.tooltips["rentsqft"]},
                    {id: "rent0", name: "Rent by # Bedrooms", selected: $scope.liveSettings.customPortfolio.show.rent0, tooltip: $rootScope.tooltips["rent0"]},
                    {id: "concessionsOneTime", name: "One-Time Concessions", selected: $scope.liveSettings.customPortfolio.show.concessionsOneTime, tooltip: $rootScope.tooltips["concessionsOneTime"]},
                    {id: "concessionsMonthly", name: "Recurring Concessions", selected: $scope.liveSettings.customPortfolio.show.concessionsMonthly, tooltip: $rootScope.tooltips["concessionsMonthly"]},
                    {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.customPortfolio.show.runrate, tooltip: $rootScope.tooltips["runrate"]},
                    {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.customPortfolio.show.runratesqft, tooltip: $rootScope.tooltips["runratesqft"]},
                    {id: "concessions", name: "Total Concession", selected: $scope.liveSettings.customPortfolio.show.concessions, tooltip: $rootScope.tooltips["concessions"]},
                    {id: "ner", name: "NER", selected: $scope.liveSettings.customPortfolio.show.ner, tooltip: $rootScope.tooltips["ner"]},
                    {id: "ner0", name: "NER by # Bedrooms", selected: $scope.liveSettings.customPortfolio.show.ner0, tooltip: $rootScope.tooltips["ner0"]},
                    {id: "nervscompavg", name: "NER vs Comp Avg", selected: $scope.liveSettings.customPortfolio.show.nervscompavg, tooltip: $rootScope.tooltips["nervscompavg"]},
                    {id: "nerweek", name: "NER vs Last Week", selected: $scope.liveSettings.customPortfolio.show.nerweek, tooltip: $rootScope.tooltips["nerweek"]},
                    {id: "nermonth", name: "NER vs Last Month", selected: $scope.liveSettings.customPortfolio.show.nermonth, tooltip: $rootScope.tooltips["nermonth"]},
                    {id: "neryear", name: "NER vs Last Year", selected: $scope.liveSettings.customPortfolio.show.neryear, tooltip: $rootScope.tooltips["neryear"]},
                    {id: "nersqft", name: "NER / Sqft", selected: $scope.liveSettings.customPortfolio.show.nersqft, tooltip: $rootScope.tooltips["nersqft"]},
                    {id: "nersqftweek", name: "NER/Sqft vs Last Week", selected: $scope.liveSettings.customPortfolio.show.nersqftweek, tooltip: $rootScope.tooltips["nersqftweek"]},
                    {id: "nersqftmonth", name: "NER/Sqft vs Last Month", selected: $scope.liveSettings.customPortfolio.show.nersqftmonth, tooltip: $rootScope.tooltips["nersqftmonth"]},
                    {id: "nersqftyear", name: "NER/Sqft vs Last Year", selected: $scope.liveSettings.customPortfolio.show.nersqftyear, tooltip: $rootScope.tooltips["nersqftyear"]},
                    {id: "nersqftvscompavg", name: "NER/Sqft vs Comp Avg", selected: $scope.liveSettings.customPortfolio.show.nersqftvscompavg, tooltip: $rootScope.tooltips["nersqftvscompavg"]},
                    {id: "last_updated", name: "Last Updated", selected: $scope.liveSettings.customPortfolio.show.last_updated, tooltip: $rootScope.tooltips["last_updated"]},
               ];


                $scope.temp.defaultOrderItems = _.cloneDeep($scope.temp.showCustomPortfolioItems);

                if (typeof $scope.liveSettings.customPortfolio.compAverages == 'undefined') {
                    $scope.liveSettings.customPortfolio.compAverages = false;
                }

                if (typeof $scope.liveSettings.customPortfolio.defaultOrder == 'undefined') {
                    $scope.liveSettings.customPortfolio.defaultOrder = true;
                }

                $scope.temp.customPortfolioSortItems = [
                    {id: "default", name: "Comp Preference"},
                    {id: "address", name: "Property Address"},
                    {id: "name", name: "Property Name"},
                    {id: "walkscore", name: "Walk Score® - Walk Score"},
                    {id: "transitscore", name: "Walk Score® - Transit Score"},
                    {id: "bikescore", name: "Walk Score® - Bike Score"},
                    {id: "phone", name: "Property Phone"},
                    {id: "constructionType", name: "Construction"},
                    {id: "owner", name: "Owner"},
                    {id: "management", name: "Management"},
                    {id: "yearBuilt", name: "Year Built"},
                    {id: "totUnits", name: "Units"},
                    {id: "sqft", name: "Sqft"},
                    {id: "occupancy", name: "Occ. %"},
                    {id: "leased", name: "Leased %"},
                    {id: "renewal", name: "Renewal %"},
                    {id: "atr_percent", name: "ATR %"},
                    {id: "weeklytraffic", name: "Traffic/Week"},
                    {id: "weeklyleases", name: "Leases/Week"},
                    {id: "rent", name: "Rent"},
                    {id: "rentsqft", name: "Rent / Sqft"},
                    {id: "rent0", name: "Rent - Studios"},
                    {id: "rent1", name: "Rent - 1 Bds."},
                    {id: "rent2", name: "Rent - 2 Bds."},
                    {id: "rent3", name: "Rent - 3 Bds."},
                    {id: "concessionsOneTime", name: "One-Time Concess."},
                    {id: "concessionsMonthly", name: "Recurring Concess."},
                    {id: "runrate", name: "Recurring Rent"},
                    {id: "runratesqft", name: "Recurring Rent / Sqft"},
                    {id: "concessions", name: "Total Concession"},
                    {id: "ner", name: "NER"},
                    {id: "nervscompavg", name: "NER vs Comp Avg"},
                    {id: "lastweeknerpercent", name: "NER vs Last Week"},
                    {id: "lastmonthnerpercent", name: "NER vs Last Month"},
                    {id: "lastyearnerpercent", name: "NER vs Last Year"},
                    {id: "nersqft", name: "NER / Sqft"},
                    {id: "nersqftvscompavg", name: "NER/Sqft vs Comp Avg"},
                    {id: "lastweeknersqftpercent", name: "NER/Sqft vs Last Week"},
                    {id: "lastmonthnersqftpercent", name: "NER/Sqft vs Last Month"},
                    {id: "lastyearnersqftpercent", name: "NER/Sqft vs Last Year"},
                    {id: "last_updated", name: "Last Updated"},
                ];

                var f = $scope.liveSettings.customPortfolio.orderBy.replace("-","");
                $scope.temp.customPortfolioSortSelected = _.find($scope.temp.customPortfolioSortItems, function(x) {
                    return x.id === f;
                });
                $scope.temp.customPortfolioSortDir = $scope.liveSettings.customPortfolio.orderBy[0] === "-" ? "desc" : "asc";
            }

            $scope.sortableOptions = {
                update: function() {
                    $scope.liveSettings.customPortfolio.defaultOrder = false;
                },
            }

            $scope.defaultSortColumns = function(value) {
                $scope.liveSettings.customPortfolio.columnSortOrder = $scope.liveSettings.customPortfolio.columnSortOrder || [];

                if ($scope.liveSettings.customPortfolio.defaultOrder) {
                    $scope.liveSettings.customPortfolio.columnSortOrder = [];
                    $scope.temp.defaultOrderItems.forEach(function(d) {
                        if (_.find(value, function(x) {
                            return x.id === d.id && x.selected === true;
                        })) {
                            $scope.liveSettings.customPortfolio.columnSortOrder.push({
                                id: d.id,
                                name: d.name,
                            });
                        }
                    });
                } else {
                    value.forEach(function(show) {
                        if (show.id !== "name") {
                            if (show.selected) {
                                if (!_.find($scope.liveSettings.customPortfolio.columnSortOrder, function (x) {
                                    return x.id === show.id;
                                })) {
                                    $scope.liveSettings.customPortfolio.columnSortOrder.push({
                                        id: show.id,
                                        name: show.name,
                                    });
                                }
                            } else {
                                _.remove($scope.liveSettings.customPortfolio.columnSortOrder, function (x) {
                                    return x.id === show.id
                                });
                            }
                        }
                    });
                }
            };

            $scope.$watch("temp.showCustomPortfolioItems", function(value) {
                if ($scope.temp && $scope.temp.defaultOrderItems) {
                    $scope.defaultSortColumns(value);
                }
            }, true);

        ////////////////////// Rankings Summary ////////////////////////////////
        $scope.resetRankingsSummarySettings = function() {
            $scope.liveSettings.rankingsSummary = {orderBy: "nersqft"}

            $scope.liveSettings.rankingsSummary.show = {
                units: true,
                unitPercent: true,
                sqft: true,
                rent: false,
                mersqft: false,
                concessionsOneTime: false,
                concessionsMonthly: false,
                concessions: false,
                runrate: false,
                runratesqft: false,
                ner: true,
                nersqft: true
            }


        }


        $scope.configureRankingsSummaryOptions = function() {
            if (!$scope.liveSettings.rankingsSummary) {
                $scope.resetRankingsSummarySettings();
            }

            $scope.temp.showRankingsSummaryOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showRankingsSummaryItems = [
                {id: "units", name: "Units", selected: $scope.liveSettings.rankingsSummary.show.units},
                {id: "unitPercent", name: "Unit %", selected: $scope.liveSettings.rankingsSummary.show.unitPercent},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.rankingsSummary.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.rankingsSummary.show.rent},
                {id: "mersqft", name: "Rent / Sqft", selected: $scope.liveSettings.rankingsSummary.show.mersqft},
                {id: "concessionsOneTime", name: "One-Time Concession", selected: $scope.liveSettings.rankingsSummary.show.concessionsOneTime},
                {id: "concessionsMonthly", name: "Recurring Concession", selected: $scope.liveSettings.rankingsSummary.show.concessionsMonthly},
                {id: "concessions", name: "Total Concession", selected: $scope.liveSettings.rankingsSummary.show.concessions},
                {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.rankingsSummary.show.runrate},
                {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.rankingsSummary.show.runratesqft},
                {id: "ner", name: "Net Eff. Rent", selected: $scope.liveSettings.rankingsSummary.show.ner},
                {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: $scope.liveSettings.rankingsSummary.show.nersqft},
            ];

            $scope.temp.rankingSummarySortItems = [
                {id: "name", name: "Name"},
                {id: "units", name: "Units"},
                {id: "unitpercent", name: "Unit %"},
                {id: "sqft", name: "Sqft"},
                {id: "rent", name: "Rent"},
                {id: "mersqft", name: "Rent/Sqft"},
                {id: "concessionsOneTime", name: "One-Time Concession"},
                {id: "concessionsMonthly", name: "Recurring Concession"},
                {id: "concessions", name: "Total Concession"},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "runrate", name: "Recurring Rent"},
                {id: "runratesqft", name: "Recurring Rent/Sqft"},
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
        $scope.resetRankingsSettings = function() {

            $scope.liveSettings.rankings = {orderBy: "nersqft"}

            $scope.liveSettings.rankings.show = {
                units: true,
                sqft: true,
                rent: false,
                mersqft: false,
                concessionsOneTime: false,
                concessionsMonthly: false,
                concessions: false,
                runrate: false,
                runratesqft: false,
                ner: true,
                nersqft: true
            }

        }

        $scope.configureRankingsOptions = function() {
            if (!$scope.liveSettings.rankings) {
                $scope.resetRankingsSettings();
            }

            $scope.temp.showRankingsOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showRankingsItems = [
                {id: "units", name: "Units", selected: $scope.liveSettings.rankings.show.units},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.rankings.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.rankings.show.rent},
                {id: "mersqft", name: "Rent / Sqft", selected: $scope.liveSettings.rankings.show.mersqft},
                {id: "concessionsOneTime", name: "One-Time Concession", selected: $scope.liveSettings.rankings.show.concessionsOneTime},
                {id: "concessionsMonthly", name: "Recurring Concession", selected: $scope.liveSettings.rankings.show.concessionsMonthly},
                {id: "concessions", name: "Total Concession", selected: $scope.liveSettings.rankings.show.concessions},
                {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.rankings.show.runrate},
                {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.rankings.show.runratesqft},
                {id: "ner", name: "Net Eff. Rent", selected: $scope.liveSettings.rankings.show.ner},
                {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: $scope.liveSettings.rankings.show.nersqft},
            ];

            $scope.temp.rankingSortItems = [
                {id: "name", name: "Name"},
                {id: "description", name: "Description"},
                {id: "units", name: "Units"},
                {id: "sqft", name: "Sqft"},
                {id: "rent", name: "Rent"},
                {id: "mersqft", name: "Rent/Sqft"},
                {id: "concessionsOneTime", name: "One-Time Concession"},
                {id: "concessionsMonthly", name: "Recurring Concession"},
                {id: "concessions", name: "Total Concession"},
                {id: "runrate", name: "Recurring Rent"},
                {id: "runratesqft", name: "Recurring Rent/Sqft"},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
            ]
            var f = $scope.liveSettings.rankings.orderBy.replace("-","");
            $scope.temp.rankingSortSelected = _.find($scope.temp.rankingSortItems, function(x) {return x.id == f})
            $scope.temp.rankingSortDir = $scope.liveSettings.rankings.orderBy[0] == "-" ? "desc" : "asc";


            if (typeof $scope.liveSettings.trends.graphs == 'undefined') {
                $scope.liveSettings.trends.graphs = true;
            }
        }

        $scope.$watch("runSettings.rankings.orderBy", function(newValue,oldValue) {
            if (oldValue && newValue) {
                var f = newValue.replace("-","");

                $scope.temp.rankingSortSelected = _.find($scope.temp.rankingSortItems, function(x) {return x.id == f})

                $scope.temp.rankingSortDir = newValue[0] == "-" ? "desc" : "asc";

            }
        })


            ////////////////////// Property Report ////////////////////////////////

            $scope.configureTrendsOptions = function() {
                if (!$scope.liveSettings.trends) {
                    $scope.resetTrendsSettings(false)
                }

                $scope.temp.showTrendsOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
                $scope.temp.showTrendsItems = [
                    {id: "occupancy", name: "Occupancy %", selected: $scope.liveSettings.trends.show.occupancy},
                    {id: "leased", name: "Leased %", selected: $scope.liveSettings.trends.show.leased},
                    {id: "renewal", name: "Renewal %", selected: $scope.liveSettings.trends.show.renewal},
                    {id: "traffic", name: "Traffic / Week", selected: $scope.liveSettings.trends.show.traffic},
                    {id: "leases", name: "Leases / Week", selected: $scope.liveSettings.trends.show.leases},
                    {id: "rent", name: "Rent", selected: $scope.liveSettings.trends.show.rent},
                    {id: "rentsqft", name: "Rent / Sqft", selected: $scope.liveSettings.trends.show.rentsqft},
                    {id: "concessions", name: "Total Concessions", selected: $scope.liveSettings.trends.show.concessions},
                    {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.trends.show.runrate},
                    {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.trends.show.runratesqft},
                    {id: "ner", name: "Net Effective Rent", selected: $scope.liveSettings.trends.show.ner},
                    {id: "nersqft", name: "Net Effective Rent / Sqft", selected: $scope.liveSettings.trends.show.nersqft},
                ];

            }

            $scope.defaultTrendsDateRange1 = function(selectedRange, selectedStartDate, selectedEndDate) {
                return {
                    Ranges : {
                        'Last 30 Days': [moment().subtract(30, 'days').startOf("day"), moment().endOf("day")],
                        'Last 90 Days': [moment().subtract(90, 'days').startOf("day"), moment().endOf("day")],
                        'Last 12 Months': [moment().subtract(1, 'year').startOf("day"), moment().endOf("day")],
                        'Lifetime': [moment().subtract(30, 'year').startOf("day"), moment().endOf("day")],
                        'Previous Month': [moment().subtract(1, 'month').startOf("month"), moment().subtract(1, 'month').endOf("month")],
                        'This Year-to-Date': [moment().startOf("year"), moment().endOf("day")],
                    },
                    selectedRange : selectedRange,
                    selectedStartDate : selectedStartDate,
                    selectedEndDate : selectedEndDate,
                    direction : "right"
                }
            }

            $scope.resetTrendsSettings = function(rebind) {

                $scope.liveSettings.trends = {
                    show: {
                        occupancy :true,
                        leased :false,
                        renewal :false,
                        traffic : false,
                        leases : false,
                        rent :false,
                        rentsqft :false,
                        concessions : false,
                        runrate: false,
                        runratesqft :false,
                        ner : true,
                        nersqft :true
                    }
                }

                $scope.liveSettings.trends.graphs = true;

                $scope.liveSettings.trends.daterange1 = $scope.defaultTrendsDateRange1('Last 90 Days', null, null);

                $scope.liveSettings.trends.daterange2 = {enabled: true}
                $scope.updateTrendsDaterange2('Last 90 Days');

                if (rebind) {
                    $scope.liveSettings.trends.daterange1.reload = true;
                    $scope.liveSettings.trends.daterange2.reload = true;
                    $scope.configureTrendsOptions();
                }
            }

            $scope.updateTrendsDaterange2 = function(selectedRange) {
                $scope.liveSettings.trends.daterange1.daterange2 = $scope.liveSettings.trends.daterange1.daterange2 || {};

                switch (selectedRange) {
                    case "Last 30 Days":
                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                                'Previous 30 Days': [moment().subtract(60, 'days').startOf("day"), moment().subtract(31, 'days').endOf("day")],
                            },
                            selectedRange : $scope.liveSettings.trends.daterange1.daterange2.selectedRange || 'Previous 30 Days',
                            selectedStartDate: $scope.liveSettings.trends.daterange1.daterange2.selectedStartDate,
                            selectedEndDate: $scope.liveSettings.trends.daterange1.daterange2.selectedEndDate,
                            direction : "right",
                            enabled: $scope.liveSettings.trends.daterange2.enabled,
                            reload: true
                        }
                        break;
                    case "Last 90 Days":
                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                                'Previous 90 Days': [moment().subtract(180, 'days').startOf("day"), moment().subtract(91, 'days').endOf("day")],
                            },
                            selectedRange : $scope.liveSettings.trends.daterange1.daterange2.selectedRange || 'Previous 90 Days',
                            selectedStartDate: $scope.liveSettings.trends.daterange1.daterange2.selectedStartDate,
                            selectedEndDate: $scope.liveSettings.trends.daterange1.daterange2.selectedEndDate,
                            direction : "right",
                            enabled: $scope.liveSettings.trends.daterange2.enabled,
                            reload: true
                        }

                        break;
                    case "Last 12 Months":
                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                                'Previous 12 Months': [moment().subtract(2, 'year').startOf("day"), moment().subtract(1, 'year').subtract(1,'day').endOf("day")],
                            },
                            selectedRange : $scope.liveSettings.trends.daterange1.daterange2.selectedRange || 'Previous 12 Months',
                            selectedStartDate: $scope.liveSettings.trends.daterange1.daterange2.selectedStartDate,
                            selectedEndDate: $scope.liveSettings.trends.daterange1.daterange2.selectedEndDate,

                            direction : "right",
                            enabled: $scope.liveSettings.trends.daterange2.enabled,
                            reload: true
                        }
                        break;
                    case "Lifetime":
                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                                'Lifetime': [moment().subtract(30, 'year').startOf("day"), moment().endOf("day")],
                            },
                            selectedRange : 'Lifetime',
                            direction : "right",
                            enabled: false,
                            reload: true
                        }
                        break;
                    case "Previous Month":
                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                                'Same Month - Previous Year': [moment().subtract(1, 'month').subtract(1, 'year').startOf("month"), moment().subtract(1, 'month').subtract(1, 'year').endOf("month")],
                            },
                            selectedRange : $scope.liveSettings.trends.daterange1.daterange2.selectedRange || 'Same Month - Previous Year',
                            selectedStartDate: $scope.liveSettings.trends.daterange1.daterange2.selectedStartDate,
                            selectedEndDate: $scope.liveSettings.trends.daterange1.daterange2.selectedEndDate,

                            direction : "right",
                            enabled: $scope.liveSettings.trends.daterange2.enabled,
                            reload: true
                        }
                        break;
                    case "This Year-to-Date":
                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                                'Previous Year-To-Date': [moment().subtract(1,'year').startOf("year"), moment().subtract(1,'year').endOf("day")],
                                'Previous Year': [moment().subtract(1,'year').startOf("year"), moment().subtract(1,'year').endOf("year")],
                            },
                            selectedRange : $scope.liveSettings.trends.daterange1.daterange2.selectedRange || 'Previous Year-To-Date',
                            selectedStartDate: $scope.liveSettings.trends.daterange1.daterange2.selectedStartDate,
                            selectedEndDate: $scope.liveSettings.trends.daterange1.daterange2.selectedEndDate,
                            direction : "right",
                            enabled: $scope.liveSettings.trends.daterange2.enabled,
                            reload: true
                        }
                        break;
                    case "Custom Range":

                        if(typeof $scope.liveSettings.trends.daterange1.selectedStartDate == 'string') {
                            $scope.liveSettings.trends.daterange1.selectedStartDate = moment($scope.liveSettings.trends.daterange1.selectedStartDate);
                            $scope.liveSettings.trends.daterange1.selectedEndDate = moment($scope.liveSettings.trends.daterange1.selectedEndDate);
                        }

                        var days = $scope.liveSettings.trends.daterange1.selectedEndDate.diff($scope.liveSettings.trends.daterange1.selectedStartDate, 'days');

                        var start = moment($scope.liveSettings.trends.daterange1.selectedStartDate.format());
                        var end = moment($scope.liveSettings.trends.daterange1.selectedStartDate.format());

                        $scope.liveSettings.trends.daterange2 = {
                            Ranges : {
                            },
                            selectedRange : 'Custom Range',
                            selectedStartDate : $scope.liveSettings.trends.daterange1.daterange2.selectedStartDate || start.subtract(1 + days, 'day'),
                            selectedEndDate : $scope.liveSettings.trends.daterange1.daterange2.selectedEndDate || end.subtract(1, 'day'),
                            direction : "right",
                            enabled: $scope.liveSettings.trends.daterange1.daterange2.enabled || false,
                            reload: true
                        }
                        break;

                }


                window.setTimeout(function() {
                    delete $scope.liveSettings.trends.daterange1.daterange2;
                }, 1000)
            }

            $scope.$watch("liveSettings.trends.daterange1", function(newValue,oldValue) {

                if (newValue && oldValue && newValue.selectedRange != oldValue.selectedRange) {
                    $scope.updateTrendsDaterange2(newValue.selectedRange)
                }
            }, true);
            
        ////////////////////// Property Report ////////////////////////////////

        $scope.configurePropertyReportOptions = function() {
            if (!$scope.liveSettings.showProfile) {
                $scope.resetPropertyReportSettings(false);
            }

            if (!$rootScope.me) {
                return;
            }

            $scope.temp.showProfileOptions = {hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showProfileItems = [
                {id: "picture", name: "Picture", selected: $scope.liveSettings.showProfile.picture},
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
                {id: "atr", name: "ATR %", selected: $scope.liveSettings.showProfile.atr},
                {id: "traf", name: "Traffic / Week", selected: $scope.liveSettings.showProfile.traf},
                {id: "lease", name: "Leases / Week", selected: $scope.liveSettings.showProfile.lease},
                {id: "walkscore", name: "Walk Score", selected: $scope.liveSettings.showProfile.walkscore},
                {id: "transitscore", name: "Transit Score", selected: $scope.liveSettings.showProfile.transitscore},
                {id: "bikescore", name: "Bike Score", selected: $scope.liveSettings.showProfile.bikescore},
            ];

            $scope.temp.showCompOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.temp.showCompItems = [
                {id: "occupancy", name: "Occupancy %", selected: $scope.liveSettings.dashboardSettings.show.occupancy},
                {id: "leased", name: "Leased %", selected: $scope.liveSettings.dashboardSettings.show.leased || false},
                {id: "renewal", name: "Renewal %", selected: $scope.liveSettings.dashboardSettings.show.renewal || false},
                {id: "atr", name: "ATR %", selected: $scope.liveSettings.dashboardSettings.show.atr || false},
                {id: "weekly", name: "Traffic & Leases / Week", selected: $scope.liveSettings.dashboardSettings.show.weekly},
                {id: "units", name: "Units", selected: $scope.liveSettings.dashboardSettings.show.units},
                {id: "unitPercent", name: "Unit %", selected: $scope.liveSettings.dashboardSettings.show.unitPercent},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.dashboardSettings.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.dashboardSettings.show.rent},
                {id: "mersqft", name: "Rent / Sqft", selected: $scope.liveSettings.dashboardSettings.show.mersqft},
                {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.dashboardSettings.show.runrate},
                {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.dashboardSettings.show.runratesqft},
                {id: "concessions", name: "Total Concessions", selected: $scope.liveSettings.dashboardSettings.show.concessions},
                {id: "ner", name: "Net Effective Rent", selected: $scope.liveSettings.dashboardSettings.show.ner},
                {id: "nersqft", name: "Net Effective Rent / Sqft", selected: $scope.liveSettings.dashboardSettings.show.nersqft},
            ];

            $scope.temp.showFloorplanOptions = {hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields"};
            $scope.temp.showFloorplanItems = [
                {id: "description", name: "Description", selected: $scope.liveSettings.profileSettings.show.description},
                {id: "units", name: "Units", selected: $scope.liveSettings.profileSettings.show.units},
                {id: "unitPercent", name: "Unit %", selected: $scope.liveSettings.profileSettings.show.unitPercent},
                {id: "sqft", name: "Sqft", selected: $scope.liveSettings.profileSettings.show.sqft},
                {id: "rent", name: "Rent", selected: $scope.liveSettings.profileSettings.show.rent},
                {id: "mersqft", name: "Rent / Sqft", selected: $scope.liveSettings.profileSettings.show.mersqft},
                {id: "runrate", name: "Recurring Rent", selected: $scope.liveSettings.profileSettings.show.runrate},
                {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.liveSettings.profileSettings.show.runratesqft},
                {id: "concessions", name: "Total Concessions", selected: $scope.liveSettings.profileSettings.show.concessions},
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
                {id: "concessions", name: "Total Concessions"},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
                {id: "runrate", name: "Recur. Rent"},
                {id: "runratesqft", name: "Recur. Rent/Sqft"},
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
                {id: "atr", name: "ATR %"},
                {id: "weeklytraffic", name: "Traffic/Week"},
                {id: "weeklyleases", name: "Leases/Week"},
                {id: "units", name: "Units"},
                {id: "unitPercent", name: "Unit %"},
                {id: "sqft", name: "Sqft"},
                {id: "rent", name: "Rent"},
                {id: "mersqft", name: "Rent/Sqft"},
                {id: "concessions", name: "Total Concessions"},
                {id: "ner", name: "Net Eff. Rent"},
                {id: "nersqft", name: "NER/Sqft"},
                {id: "runrate", name: "Recur. Rent"},
                {id: "runratesqft", name: "Recur. Rent/Sqft"},
            ]
            var f = $scope.liveSettings.dashboardSettings.orderByComp.replace("-","");
            $scope.temp.compSortSelected = _.find($scope.temp.compSortItems, function(x) {return x.id == f});

            if (!$scope.temp.compSortSelected) {
                $scope.temp.compSortSelected = $scope.temp.compSortItems[0];
            }

            $scope.temp.compSortDir = $scope.liveSettings.dashboardSettings.orderByComp[0] == "-" ? "desc" : "asc";
        };

        $scope.resetPropertyReportSettings = function(rebind) {
            $scope.liveSettings.dashboardSettings = $reportingService.getDashboardSettings($rootScope.me, $(window).width());
            $scope.liveSettings.profileSettings = $reportingService.getProfileSettings($(window).width());
            $scope.liveSettings.showProfile = $reportingService.getInfoRows($rootScope.me);
            $scope.liveSettings.dashboardSettings.daterange.direction = "right";

            if (rebind) {
                $scope.liveSettings.dashboardSettings.daterange.reload = true;
                $scope.configurePropertyReportOptions();
                $scope.temp.bedroom = $scope.temp.bedrooms[0];
            }

        }

        $scope.configureConcessionOptions = function() {
            if (!$scope.liveSettings.concession) {
                $scope.resetConcessionSettings();
            }
        }

        $scope.resetConcessionSettings = function() {
            $scope.liveSettings.concession = {
                daterange: {
                    Ranges : {
                        '30 Days': [moment().subtract(30, 'days').startOf("day"), moment().endOf("day")],
                        '90 Days': [moment().subtract(90, 'days').startOf("day"), moment().endOf("day")],
                        '12 Months': [moment().subtract(1, 'year').startOf("day"), moment().endOf("day")],
                        'Year-to-Date': [moment().startOf("year"), moment().endOf("day")],
                        'Lifetime': [moment().subtract(30, 'year').startOf("day"), moment().endOf("day")],
                    },
                    selectedRange : "90 Days",
                    selectedStartDate : null,
                    selectedEndDate : null,
                    direction: "right"
                }
            }
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

        $scope.saveReport = function() {
            $scope.UItoSettings();
            $scope.UItoSettingsMultiple();

            require([
                '/app/reporting/saveReportController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/reporting/saveReport.html?bust=' + version,
                    controller: 'saveReportController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        settings: function () {
                            return $scope.liveSettings;
                        },
                        reportIds: function () {
                            return $scope.reportIds;
                        },
                        type: function() {
                            return $scope.reportType;
                        },
                        currentReport: function() {
                            return $scope.currentReport;
                        },
                        reportNames: function() {
                            return $scope.reportNames;
                        }
                    }
                });

                modalInstance.result.then(function (newReport) {

                    _.remove($scope.savedReports, function(x) {return x._id == newReport._id});

                    $scope.savedReports.push(newReport);

                    $scope.currentReport = newReport;
                }, function (from) {
                    //Cancel
                });
            });
        }

        $scope.editReport = function(report) {

            require([
                '/app/reporting/editReportController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/reporting/editReport.html?bust=' + version,
                    controller: 'editReportController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        report: function () {
                            return report;
                        }
                    }
                });

                modalInstance.result.then(function (reply) {

                    _.remove($scope.savedReports, function(x) {return x._id == reply.newReport._id});

                    var current = false;
                    if ($scope.currentReport && $scope.currentReport._id.toString() == reply.newReport._id.toString()) {
                        current = true;
                    }

                    if (!reply.deleted) {
                        $scope.savedReports.push(reply.newReport);

                        if (current) {
                            $scope.currentReport = reply.newReport;
                        }
                    } else {
                        if (current) {
                            delete $scope.currentReport;
                        }
                    }
                }, function (from) {
                    //Cancel
                });
            });
        }

    }]);
});
