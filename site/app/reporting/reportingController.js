'use strict';
define([
    'app',
    '../../components/filterlist/module.js',
], function (app) {

    app.controller('reportingController', ['$scope','$rootScope','$location','$propertyService', function ($scope,$rootScope,$location,$propertyService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "Reporting";

        $rootScope.sideMenu = []

        $scope.options = { dropdown: true, labelAvailable: "Available Comps", labelSelected: "Selected Comps", searchLabel: "Comps" }
        $scope.reportOptions = { dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Reports", labelSelected: "Selected Reports", searchLabel: "Reports" }

        $scope.reportItems = []
        $scope.reportItems.push({_id: "community_amenities", name: "Community Amenities", selected:true});
        $scope.reportItems.push({_id: "location_amenities", name: "Location Amenities", selected:true});
        $scope.reportItems.push({_id: "fees_deposits", name: "Fees & Deposits", selected:true});



        $propertyService.search({limit: 1000, permission: 'PropertyManage', active: true, select : "_id name comps.id"}).then(function (response) {
            $scope.myProperties = response.data.properties;


            var id = $rootScope.me.settings.defaultPropertyId;


            if (!$scope.myProperties || $scope.myProperties.length == 0) {
                id = null;
            }
            else if (!id) {
                $scope.selectedProperty = $scope.myProperties[0];
            } else {
                $scope.selectedProperty = _.find($scope.myProperties, function(x) {return x._id.toString() == id})
            }

            if ($scope.selectedProperty) {
                $scope.loadComps(_.pluck($scope.selectedProperty.comps,"id"), $scope.selectedProperty._id)
            } else {
                $scope.localLoading = true;
            }

        })

        $scope.loadComps = function(compids,subjectid) {
            $propertyService.search({limit: 1000, permission: 'PropertyView', active: true, select : "_id name", ids: compids, sort: "name"}).then(function (response) {
                $scope.items = [];
                response.data.properties.forEach(function(c) {
                    if (c._id != subjectid) {
                        $scope.items.push({id: c._id, name: c.name, selected: true});
                    }
                })
                $scope.localLoading = true;

            })

        }

        $scope.changeProperty = function() {
            $scope.localLoading = false;
            $scope.loadComps(_.pluck($scope.selectedProperty.comps,"id"), $scope.selectedProperty._id);
        }


    }]);
});