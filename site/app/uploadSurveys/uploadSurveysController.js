"use strict";
define([
    "app",
    "async",
], function(app, async) {
    app.controller("uploadSurveysController", ["$scope", "$rootScope", "$location", "ngProgress", "toastr", "$propertyService", "$q", function($scope, $rootScope, $location, ngProgress, toastr, $propertyService, $q) {
        $scope.data = {};

        window.setTimeout(function() {
            window.document.title = "Admin | Upload Surveys | BI:Radix";
        }, 1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "UploadSurveys";
        $scope.localLoading = true;

        $scope.upload = function() {
            if (!$scope.data.property) {
                toastr.error("Please select a proeprty");
                return;
            }

            var data = $scope.parseTSV($scope.data.surveys);

            if (data.length < 6) {
                toastr.error("Must contain at least 6 rows");
                return;
            }

            if (data[4].length < 6) {
                toastr.error("Must contain at least 6 columns");
                return;
            }

            if (data[4].length % 2 != 0) {
                toastr.error("Must contain even number of columns");
                return;
            }

            if (data[0][0] != 'Date' || data[1][0] != 'Occupancy' || data[2][0] != 'Traffic' || data[3][0] != 'Leases' || data[4][0] != 'Type') {
                toastr.error("First column must be: Type,Occupancy,Traffic,Leases,Date");
                return;
            }

            var d;
            var dDate;
            var i, j;
            for (i = 4; i < data[0].length; i+=2) {
                d = data[0][i];
                dDate = new Date(d);

                if (isNaN(dDate.getTime())) {
                    toastr.error(d + " is not a valid date.");
                    return;
                }

                if (dDate.getTime() > (new Date()).getTime()) {
                    toastr.error(d + " is a future date.");
                    return;
                }
            };

            var type;

            for (i = 5; i < data.length; i++) {
                data[i][0] = data[i][0].toString().toLowerCase();
                type = data[i][0].split("x");

                if (type.length != 2) {
                    toastr.error(data[i][0] + " must be in the format bedrooms x bathrooms ex: 3x1.5");
                    return;
                }
                if (type[0] == "" || isNaN(type[0])) {
                    toastr.error(data[i][0] + " must have a valid number of bedrooms");
                    return;
                }
                if (type[1] == "" || isNaN(type[1])) {
                    toastr.error(data[i][0] + " must have a valid number of bathrooms");
                    return;
                }

                for (j = 4; j < data[i].length; j+=2) {
                    // We found rent
                    if (typeof data[i][j + 1] !== "undefined" && data[i][j + 1] !== null && data[i][j + 1] !== "") {
                        // But missing concessions
                        if (typeof data[i][j] === "undefined" || data[i][j] === null || data[i][j] === "") {
                            toastr.error(data[i][0] + " must have a valid number for Rent since Concession is set.");
                            return;
                        }
                    }
                }
            }

            $scope.localLoading = false;
            $propertyService.getFullProperty($scope.data.property._id).then(function (response) {

                var p = response.data.properties[0];
                p.floorplans.forEach(function(x) {delete x.new});
                var floorplans = {};
                var update = false;

                for(var i = 5; i < data.length; i++) {
                    var fp = {};
                    var type = data[i][0].split("x");
                    fp.bedrooms = parseInt(type[0]);
                    fp.bathrooms = type[1].trim();
                    fp.description = data[i][1];
                    fp.units = parseInt(data[i][2]);
                    fp.sqft = parseInt(data[i][3]);

                    var old = _.filter(p.floorplans,function(x) {
                        return x.bedrooms.toString() == fp.bedrooms.toString() && x.bathrooms.toString() == fp.bathrooms.toString() && x.sqft.toString() == fp.sqft.toString() && !x.new
                    });

                    //console.log('1:',old);

                    if (old.length > 1) {
                        old = _.filter(old,function(x) {
                            return x.units.toString() == fp.units.toString() && !x.new
                        });
                    }

                    //console.log('2:',old);

                    if (old.length > 1) {
                        old = _.filter(old,function(x) {
                            return x.description.toString() == fp.description.toString() && !x.new
                        });
                    }

                    //console.log('3:',old);
                    //return;

                    var cr;

                    try {
                        cr = crypto;
                    } catch (er) {
                        cr = msCrypto;
                    }


                    if (old.length == 1) {
                        fp = _.cloneDeep(old[0]);
                    } else {
                        fp.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = cr.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
                            return v.toString(16);
                        });
                        fp.new = true;
                        update = true;
                        p.floorplans.push(fp);
                    }

                    floorplans[i] = fp;

                }

                //console.log(p.floorplans);

                if (update) {
                    $propertyService.lookups().then(function (response) {

                        p.community_amenities = _.pluck(_.filter(response.data.amenities, function(x) {
                            return (p.community_amenities || []).indexOf(x._id.toString()) > -1;
                        }),"name")

                        p.location_amenities = _.pluck(_.filter(response.data.amenities, function(x) {
                            return (p.location_amenities || []).indexOf(x._id.toString()) > -1;
                        }),"name")

                        p.floorplans.forEach(function(fp) {
                            fp.amenities = _.pluck(_.filter(response.data.amenities, function(x) {
                                return (fp.amenities || []).indexOf(x._id.toString()) > -1;
                            }),"name")
                        })

                        $propertyService.update(p).then(function (response) {

                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                $scope.localLoading = true;
                            }
                            else {
                                $scope.addSurveys(data, floorplans, p);
                            }

                        }, function (response) {
                            toastr.error('Unable to update property. Please contact an administrator.');

                            $scope.localLoading = true;
                        })
                    });
                } else {
                    $scope.addSurveys(data, floorplans, p);
                }


            });
        }

        $scope.addSurveys = function(data, floorplans, property) {
            var surveys = [];
            for (var i = 4; i < data[0].length; i+=2) {
                var survey = {};
                survey.occupancy = data[1][i];
                survey.weeklytraffic = data[2][i];
                survey.weeklyleases = data[3][i];
                survey.date = new Date(data[0][i]);
                survey.propertyid = property._id;
                survey.floorplans = [];
                for(var fi in floorplans) {
                    var fp = _.cloneDeep(floorplans[fi]);
                    fp.amenities = [];
                    fp.rent = parseInt(data[fi][i]);
                    fp.concessions = parseInt(data[fi][i + 1]);
                    survey.floorplans.push(fp);
                }

                surveys.push(survey);
            }
            var errors = [];
            var warnings = [];
            var successes = [];

            $propertyService.getSurveyDates(property._id).then(function (response) {
                var dates = _.pluck(response.data.survey,"date");
                async.eachSeries(surveys
                    , function (survey, callbackp) {
                        var inrange = _.find(dates, function(d) {
                            var diff = moment(d).diff(moment(survey.date));
                            var days = Math.abs(diff / 1000 / 60 / 60 / 24);
                            return days < 2;
                        })

                        if (inrange) {
                            warnings.push(moment(survey.date).format("MM/DD/YYYY") + ": Duplicate Date / Not Added");
                            callbackp();
                        }
                        else {
                            $propertyService.createSurvey(property._id, survey).then(
                                function(resp) {
                                    if (resp.data.errors && resp.data.errors.length > 0) {
                                        errors.push(moment(survey.date).format("MM/DD/YYYY") + ": " + resp.data.errors[0].msg);
                                    }
                                    else {
                                        dates.push(survey.date);
                                        successes.push(moment(survey.date).format("MM/DD/YYYY") + " added successfully");
                                    }
                                    callbackp();
                            }, function(resp) {
                                    errors.push(moment(survey.date).format("MM/DD/YYYY") + ': Unknown error');
                                    callbackp();
                                })
                        }
                    },
                    function done() {

                        if (successes.length > 0) {
                            toastr.success(successes.join("<Br>"));
                        }

                        if (errors.length > 0) {
                            toastr.error(errors.join("<Br>"));
                        }

                        if (warnings.length > 0) {
                            toastr.warning(warnings.join("<Br>"));
                        }

                        $scope.localLoading = true;
                    })
            },function() {});



        }

        $scope.parseTSV = function(data) {
            data = data || '';

            var resp = [];

            var rows = data.split(/\r?\n/);

            rows.forEach(function(row) {
                var cols = row.split("\t");
                if (cols.length > 1)
                {
                    resp.push(cols);
                }
            })

            return resp;
        };

        $scope.searchAsync = function(term) {
            var deferred = $q.defer();

            $scope.autocompleteproperties(term, function(result) {
                result = _.sortByOrder(result, ["name"], [true]);
                deferred.resolve(result);
            });

            return deferred.promise;
        };

        $scope.autocompleteproperties = function(search, callback) {
            $propertyService.search({
                limit: 100,
                permission: ["PropertyManage"],
                active: true,
                searchName: search,
                skipAmenities: true,
                hideCustom: true,
                select: "name address city state",
                sort: "name",
            }).then(function(response) {
                response.data.properties.forEach(function(p) {
                   p.name += " - " + p.address + ", " + p.city + ", " + p.state;
                });
                callback(response.data.properties);
            }, function(error) {
                callback([]);
            });
        };
    }]);
});
