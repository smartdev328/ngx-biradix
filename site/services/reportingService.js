angular.module("biradix.global").factory("$reportingService", ["$http","$cookies","$cookieSettingsService", "toastr",
    function ($http,$cookies,$cookieSettingsService,toastr) {
        var fac = {};

        fac.getDateRangeLabel = function(daterange, offset) {
            var d1 = daterange.selectedRange;
            if (d1 === "Custom Range") {
                var d1s, d1e;

                if (daterange.selectedStartDate._isUTC) {
                    d1s = moment(daterange.selectedStartDate._d).utcOffset(offset).format("MM/DD/YY");
                } else {
                    d1s = moment(daterange.selectedStartDate._d).utcOffset(offset).format("MM/DD/YY");
                }

                if (daterange.selectedEndDate._isUTC) {
                    d1e = moment(daterange.selectedEndDate._d).utcOffset(offset).format("MM/DD/YY");
                } else {
                    d1e = moment(daterange.selectedEndDate._d).utcOffset(offset).format("MM/DD/YY");
                }

                d1 = d1s + "-" + d1e;
            }
            return d1;
        };

        fac.reports = function(compids, subjectid, reports, options) {
            return $http.post(gAPI + "/api/1.0/reporting/" + subjectid + "?bust=" + (new Date()).getTime(), {
                compids: compids,
                reports: reports,
                options: options,
            }, {
                headers: {"Authorization": "Bearer " + $cookies.get("token") }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.reportsGroup = function(propertyids, reports, settings) {
            return $http.post(gAPI + "/api/1.0/reporting/group"+ "?bust=" + (new Date()).getTime(), {
                propertyids: propertyids,
                reports: reports,
                settings: settings,
            }, {
                headers: {"Authorization": "Bearer " + $cookies.get("token") }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getDashboardSettings = function(me, width) {
            var settings = {}
            settings.daterange=$cookieSettingsService.getDaterange();
            settings.summary = $cookieSettingsService.getSummary();

            settings.totals = $cookieSettingsService.getTotals();

            settings.nerScale = $cookieSettingsService.getNerScale();

            settings.selectedBedroom = $cookieSettingsService.getBedrooms();
            settings.selectedPerspective = $cookieSettingsService.getPerspective();

            settings.orderByComp = "number";

            if ($cookies.get("cmp.o")) {
                settings.orderByComp = $cookies.get("cmp.o");
            }

            settings.show = fac.getDefaultDashboardCompColumns(me,width);

            if ($cookies.get("cmp.s")) {
                settings.show = JSON.parse($cookies.get("cmp.s"));
            }

            return settings;
        }

        fac.getProfileSettings = function(width) {
            var settings = {}
            settings.orderByFp = "sqft";

            if ($cookies.get("fp.o")) {
                settings.orderByFp = $cookies.get("fp.o");
            }

            settings.show = fac.getDefaultProfileFloorplanColumns(width);

            if ($cookies.get("fp.s")) {
                settings.show = JSON.parse($cookies.get("fp.s"));
            }

            settings.daterange=$cookieSettingsService.getDaterange();
            settings.graphs=$cookieSettingsService.getGraphs();
            settings.nerScale= $cookieSettingsService.getNerScale();
            settings.selectedPerspective = $cookieSettingsService.getPerspective();

            return settings;

        }

        fac.getInfoRows = function(me) {
            var settings = fac.getDefaultInfoRows(me);
            if ($cookies.get("pr.s")) {
                settings = JSON.parse($cookies.get("pr.s"));
            }
            if (typeof settings.picture == "undefined") {
                settings.picture = true;
            }
            return settings;
        }

        fac.getDefaultInfoRows = function(me) {
            return {
                picture: true,
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
                leased: me ? me.settings.showLeases : true,
                renewal: me ? me.settings.showRenewal : true,
                atr: me ? me.settings.showATR : false,
                traf: true,
                lease: true,
                walkscore: false,
                bikescore: false,
                transitscore: false,
            };
        }

        fac.getDefaultProfileFloorplanColumns = function(width) {
            var columns = {
                description: true,
                units: true,
                unitPercent: true,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false,
            }

            if (width < 1024) {
                columns.rent = false;
                columns.concessions = false;
                columns.unitPercent = false;
            }

            if (width < 500) {
                columns.ner = false;
                columns.description = false;
            }

            return columns;
        }

        fac.getDefaultDashboardCompColumns = function(me, width) {
            var columns = {
                units: true,
                unitPercent: false,
                occupancy: true,
                leased: me.settings.showLeases,
                renewal: me.settings.showRenewal,
                atr: me.settings.showATR,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false,
                weekly: false,
            }

            if (width < 1175) {
                columns.rent = false;
                columns.concessions = false;
            }

            if (width < 1000) {
                columns.ner = false;
            }

            if (width < 500) {
                columns.sqft = false;
                columns.occupancy = false;
                columns.leased = false
                columns.renewal = false
                columns.units = false;
            }

            return columns;
        }

        fac.multiSelectWatcher = function($scope, strListName) {
            $scope.$watch(strListName, function (n, o) {
                var list = eval("$scope." + strListName);
                var groupsFound = {};
                if (!list) {
                    return;
                }

                var changed = false;
                // find counts for each group after selection
                list.forEach(function (i) {
                    if (i.selected) {
                        groupsFound[i.group] = (groupsFound[i.group] || 0) + 1;
                    }
                });
                var newItem;

                Object.keys(groupsFound).forEach(function(gr) {
                    if (groupsFound[gr] > 1) {
                        // Find a first selected item from updated list that was not in the original list
                        newItem = _.find(n, function(x) {
                            return x.selected && x.group === gr && !_.find(o, function(y) {
                                return y.selected && y.group === gr && y.id.perspectiveId === x.id.perspectiveId;
                            });
                        });

                        list.forEach(function (i) {
                            if (i.group === gr) {
                                i.selected = i.id.perspectiveId === newItem.id.perspectiveId;
                            }
                        });
                        changed = true;
                    }
                });

                if (changed) {
                    toastr.warning("Multiple perspectives for the same property can't be run at the same time, please select only 1 perspective per property.");
                }
            }, true);
        };

        return fac;
    }]);
