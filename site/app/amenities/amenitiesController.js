'use strict';
define([
    'app',
    '../../services/amenityService',
    '../../services/propertyService',
    '../../services/propertyAmenityService',
    '../../services/gridService',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('amenitiesController', ['$scope','$rootScope','$location','$amenityService','$authService','ngProgress','$dialog','$uibModal','$gridService','toastr','$propertyService','$propertyAmenityService', function ($scope,$rootScope,$location,$amenityService,$authService,ngProgress,$dialog,$uibModal,$gridService,toastr,$propertyService,$propertyAmenityService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        window.setTimeout(function() {window.document.title = "Amenities | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Amenities";


        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.limit = 50;
        $scope.search = {}
        $scope.searchable = ['name','type','aliases'];

        $scope.showInactive = true;
        $scope.showActive = false;


        // /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $amenityService.search({getCounts: true, active: true}).then(function (response) {
                $scope.data = response.data.amenities;
                $scope.data.forEach(function(a) {
                    a.old_name = a.name;
                    a.aliasesList = (a.aliases || []).join("\n");
                    a.old_aliasesList = a.aliasesList;
                    
                })

                $propertyService.getAmenityCounts().then(function (response) {

                        $scope.data.forEach(function(a) {
                            a.properties = response.data.counts[a._id] || 0;
                        })

                    $scope.localLoading = true;
                },
                function (error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }
                    $scope.localLoading = true;
                });


            },
            function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.localLoading = true;
            });
        }



        $scope.toggleOpen = function(row) {
            row.open = !row.open;
            row.loaded = false;

            if (row.open) {
                $propertyService.search({select:"name", amenity: row._id, limit: 1000,sort:"-date"}).then(function (response) {
                    row.loaded = true;
                    row.props = response.data.properties;
                });
            }
        }

        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }

        $scope.calcActive = function() {
            if ($scope.showActive === $scope.showInactive) {
                delete $scope.search.approved;
            }
            else
            {
                $scope.search.approved = $scope.showActive;
            }

            $scope.resetPager();
        }


        $scope.calcActive();
        $scope.reload();


        $scope.searchFilter = function (obj) {
            if (!$scope.searchText) return true;
            var re = new RegExp($scope.searchText, 'i');

            var ret = false;
            $scope.searchable.forEach(function (x) {
                if (re.test(obj[x].toString())) {
                    ret = true;
                }
            })
            return ret;
        };


        $scope.pageStart = function () {
            if ($scope.filtered.length == 0) return 0;
            return (($scope.currentPage || 1) - 1) * parseInt($scope.limit) + 1;
        }

        $scope.pageEnd = function () {
            if ($scope.filtered.length == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.limit);

            if (x > $scope.filtered.length) {
                x = $scope.filtered.length;
            }

            return parseInt(x);
        }

        $scope.pressed = function(row,event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                $scope.update(row);
            }
        }

        $scope.update = function(row) {
            $amenityService.update(row).then(function(response) {

                if (response.data.errors) {
                    toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                }
                else {
                    toastr.success(row.name + ' updated successfully');
                    row.edit = false;
                    row.old_name = row.name;
                    row.approved = true;
                }

            }, function(response) {
                toastr.error('Unable to update amenity. Please contact an administrator');

            })
        }

        $scope.saveAliases = function(row) {

            var aliases = [];

            row.aliasesList.split("\n").forEach(function(x) {
                var a= x.trim();
                if (a && a.length > 1) {
                    aliases.push(a);
                }
            })
            var amenity = {_id: row._id, aliases: aliases}

            $amenityService.updateAliases(amenity).then(function(response) {

                if (response.data.errors) {
                    toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                }
                else {
                    toastr.success(row.name + ' updated successfully');
                    row.aliases = aliases;
                    $("#aliases_" + row._id).dropdown('toggle');
                }

            }, function(response) {
                toastr.error('Unable to update amenity. Please contact an administrator');

            })
        }

        $scope.delete = function(row) {
            $dialog.confirm('Are you sure you want to delete "<B>' + row.name +'</B>"?', function() {
                $propertyAmenityService.deleteAmenity(row._id).then(function(response) {
                    if (response.data.errors) {
                        toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                    }
                    else {
                        toastr.success(row.name + ' deleted successfully');
                        $scope.reload();
                    }
                }, function(response) {
                    toastr.error('Unable to update amenity. Please contact an administrator');
                })

            });
        }

        $scope.map = function (amenity) {
            require([
                '/app/amenities/mapAmenityController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/amenities/mapAmenity.html?bust=' + version,
                    controller: 'mapAmenityController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        amenity: function () {
                            return amenity;
                        },
                        amenities: function() {
                            return $scope.data
                        }
                    }
                });

                modalInstance.result.then(function (mapped) {

                    toastr.success(amenity.name + " mapped to" + mapped.name  + " successfully.");
                    $scope.reload()
                }, function () {

                });
            });
        }
    }]);
});