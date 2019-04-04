angular.module("biradix.global").factory("$marketSurveyPMSService", ["$uibModal",
    function($uibModal) {
        var fac = {};

        fac.registerPMSFunctions = function(scope) {
            scope.pmsNext = function() {
                if (scope.pms.values.occupancy === "BIRADIX") {
                    scope.survey.occupancy = scope.originalSurvey.occupancy;
                } else {
                    scope.survey.occupancy = scope.pms.property.occupancy;
                }

                if (scope.pms.values.leased === "BIRADIX") {
                    scope.survey.leased = scope.originalSurvey.leased;
                } else {
                    scope.survey.leased = scope.pms.property.leased;
                }

                if (scope.pms.values.atr === "BIRADIX") {
                    scope.survey.atr = scope.originalSurvey.atr;
                } else {
                    scope.survey.atr = scope.pms.property.atr;
                }

                if (scope.pms.values.weeklytraffic === "BIRADIX") {
                    scope.survey.weeklytraffic = scope.originalSurvey.weeklytraffic;
                } else {
                    scope.survey.weeklytraffic = scope.pms.property.weeklytraffic;
                }

                if (scope.pms.values.weeklyleases === "BIRADIX") {
                    scope.survey.weeklyleases = scope.originalSurvey.weeklyleases;
                } else {
                    scope.survey.weeklyleases = scope.pms.property.weeklyleases;
                }

                var fpid;
                var surveyFp;
                var originalSurveyFp;
                for (fpid in scope.pms.values.rent) {
                    surveyFp = _.find(scope.survey.floorplans, function(fp) {
                        return fp.id.toString() === fpid.toString();
                    });

                    originalSurveyFp = _.find(scope.originalSurvey.floorplans, function(fp) {
                        return fp.id.toString() === fpid.toString();
                    });

                    if (scope.pms.values.rent[fpid] === "BIRADIX") {
                        surveyFp.rent = originalSurveyFp.rent;
                    } else {
                        surveyFp.rent = scope.pms.mappedFloorplans[fpid].rent;
                    }

                    scope.updateDone(surveyFp, true, "rent");
                    if (scope.settings.showDetailed) {
                        surveyFp.concessionsOneTime = surveyFp.concessionsOneTime || 0;
                        surveyFp.concessionsMonthly = surveyFp.concessionsMonthly || 0;
                        scope.updateDone(surveyFp, true, "concessionsOneTime");
                        scope.updateDone(surveyFp, true, "concessionsMonthly");
                    } else {
                        surveyFp.concessions = surveyFp.concessions || 0;
                        scope.updateDone(surveyFp, true, "concessions");
                    }
                }

                scope.updateDone("occupancy", true);
                scope.updateDone("leased", true);
                scope.updateDone("atr", true);
                scope.updateDone("traffic", true);

                scope.pms.show = false;
            };

            scope.pmsBack = function() {
                scope.pms.show = true;
            };

            scope.pmsOccupancy = function() {
                $uibModal.open({
                    templateUrl: "/app/marketSurvey/occupancy.html?bust=" + version,
                    controller: "marketSurveyOccupancyController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        occupiedUnitCounts: function() {
                            return scope.pms.unitCounts.occupied;
                        },
                        totalUnits: function() {
                            return scope.pms.property.totalUnits;
                        },
                        occupancy: function() {
                            return scope.pms.property.occupancy;
                        }
                    }
                });
            };

            scope.pmsLeased = function() {
                $uibModal.open({
                    templateUrl: "/app/marketSurvey/leased.html?bust=" + version,
                    controller: "marketSurveyLeasedController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        leasedUnitCounts: function() {
                            return scope.pms.unitCounts.leased;
                        },
                        totalUnits: function() {
                            return scope.pms.property.totalUnits;
                        },
                        leased: function() {
                            return scope.pms.property.leased;
                        }
                    }
                });
            };

            scope.pmsATR = function() {
                $uibModal.open({
                    templateUrl: "/app/marketSurvey/atr.html?bust=" + version,
                    controller: "marketSurveyATRController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        unitCounts: function() {
                            return scope.pms.unitCounts;
                        },
                        atr: function() {
                            return scope.pms.property.atr;
                        }
                    }
                });
            };

            scope.pmsTraffic = function() {
                $uibModal.open({
                    templateUrl: "/app/marketSurvey/traffic.html?bust=" + version,
                    controller: "marketSurveyTrafficController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        propertyProspects: function() {
                            return scope.pms.propertyProspects;
                        },
                        dates: function() {
                            return scope.pms.dates;
                        },
                    }
                });
            };

            scope.pmsLeases = function() {
                $uibModal.open({
                    templateUrl: "/app/marketSurvey/leases.html?bust=" + version,
                    controller: "marketSurveyLeasesController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        leases: function() {
                            return scope.pms.leases;
                        },
                        dates: function() {
                            return scope.pms.dates;
                        },
                    }
                });
            };
        };

        fac.getYardiDiff = function(scope) {
            var diff = [];

            if (!scope.pms) {
                return diff;
            }

            if (parseFloat(scope.pms.property.occupancy || 0).toFixed(3) !== parseFloat(scope.survey.occupancy || 0).toFixed(3)) {
                diff.push({description: "Occupancy % Difference Survey vs Yardi: " + (scope.survey.occupancy || 0).toFixed(2) + " vs " + scope.pms.property.occupancy.toFixed(2)});
            }

            if (parseFloat(scope.pms.property.leased || 0).toFixed(3) !== parseFloat(scope.survey.leased || 0).toFixed(3)) {
                diff.push({description: "Leased % Difference Survey vs Yardi: " + (scope.survey.leased || 0).toFixed(2) + " vs " + scope.pms.property.leased.toFixed(2)});
            }

            if (parseFloat(scope.pms.property.atr || 0).toFixed(3) !== parseFloat(scope.survey.atr || 0).toFixed(3)) {
                diff.push({description: "Apartments to Rent Difference Survey vs Yardi: " + (scope.survey.atr || 0).toFixed(0) + " vs " + scope.pms.property.atr.toFixed(0)});
            }

            if (parseFloat(scope.pms.property.weeklyleases || 0).toFixed(3) !== parseFloat(scope.survey.weeklyleases || 0).toFixed(3)) {
                diff.push({description: "Leases/Week Difference Survey vs Yardi: " + (scope.survey.weeklyleases || 0).toFixed(0) + " vs " + scope.pms.property.weeklyleases.toFixed(0)});
            }

            if (parseFloat(scope.pms.property.weeklytraffic || 0).toFixed(3) !== parseFloat(scope.survey.weeklytraffic || 0).toFixed(3)) {
                diff.push({description: "Traffic/Week Difference Survey vs Yardi: " + (scope.survey.weeklytraffic || 0).toFixed(0) + " vs " + scope.pms.property.weeklytraffic.toFixed(0)});
            }

            var pmsFp;
            var fpName;
            scope.survey.floorplans.forEach((fp) => {
                fpName = fp.bedrooms + "x" + fp.bathrooms;

                if (fp.description && fp.description != "") {
                    fpName += " " + fp.description;
                } else {
                    fpName += " - ";
                }

                fpName += " " + fp.sqft + " Sqft";
                fpName += ", " + fp.units + " Units";

                pmsFp = scope.pms.mappedFloorplans[fp.id];
                if (pmsFp && pmsFp.rent.toFixed(0) !== fp.rent.toFixed(0)) {
                    diff.push({description: fpName + " Difference Survey vs Yardi: " + (fp.rent || 0).toFixed(0) + " vs " + (pmsFp.rent || 0).toFixed(0)});
                }
            });

            return diff;
        };

        return fac;
    }]);

