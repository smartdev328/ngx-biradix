'use strict';
define([
    'app',
], function (app) {

    app.controller('uploadSurveysController', ['$scope','$rootScope','$location','ngProgress','toastr','$propertyService', function ($scope,$rootScope,$location,ngProgress,toastr,$propertyService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $scope.data = {};

        window.document.title = "Admin | Upload Surveys | BI:Radix";

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "UploadSurveys";

        $scope.reload = function () {
            $scope.localLoading = false;

            $propertyService.search({limit: 1000, permission: 'PropertyManage', active: true, select : "_id name"}).then(function (response) {
                $scope.myProperties = response.data.properties;

                //Temp
                $scope.data.property = $scope.myProperties[0];
                $scope.data.surveys = $("#sample").val();

                $scope.localLoading = true;
            }, function(error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.localLoading = true;
            })

        }

        $scope.reload();

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

            if (data[0].length < 6) {
                toastr.error("Must contain at least 6 columns");
                return;
            }

            if (data[0].length % 2 != 0) {
                toastr.error("Must contain even number of columns");
                return;
            }

            if (data[0][0] != 'Type' || data[1][0] != 'Occupancy' || data[2][0] != 'Traffic' || data[3][0] != 'Leases' || data[4][0] != 'Date') {
                toastr.error("First column must be: Type,Occupancy,Traffic,Leases,Date");
                return;
            }

            $scope.localLoading = false;
            $propertyService.getFullProperty($scope.data.property._id).then(function (response) {
                var p = response.data.properties[0];
                var floorplans = {};
                var update = false;

                for(var i = 5; i < data.length; i++) {
                    var fp = {};
                    var type = data[i][0].split("x");
                    fp.bedrooms = type[0];
                    fp.bathrooms = type[1];
                    fp.description = data[i][1];
                    fp.units = data[i][2];
                    fp.sqft = data[i][3];

                    var old = _.filter(p.floorplans,function(x) {
                        return x.bedrooms.toString() == fp.bedrooms.toString() && x.bathrooms.toString() == fp.bathrooms.toString() && x.sqft.toString() == fp.sqft.toString()
                    });

                    if (old.length > 1) {
                        old = _.filter(old,function(x) {
                            return x.units.toString() == fp.units.toString()
                        });
                    }

                    if (old.length > 1) {
                        old = _.filter(old,function(x) {
                            return x.description.toString() == fp.description.toString()
                        });
                    }

                    if (old.length == 1) {
                        fp = old[0];
                    } else {
                        fp.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
                            return v.toString(16);
                        });
                        update = true;
                        p.floorplans.push(fp);
                    }

                    floorplans[i] = fp;

                }

                if (update || true) {
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
                            toastr.error('Unable to update property. Please contact an administrator');

                            $scope.localLoading = true;
                        })
                    });
                } else {
                    $scope.addSurveys(data, floorplans, p);
                }


            });
        }

        $scope.addSurveys = function(data, floorplans, property) {
            console.log(data, floorplans, property)
            //TODO: Populate all Survey Objects
            //TODO: Give warning if survey within 4 days or add/success

            $scope.localLoading = true;
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
        }

    }]);
});