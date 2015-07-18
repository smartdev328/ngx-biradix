'use strict';
define([
    'app',
    '../../components/filterlist/module.js',
    '../../components/reports/communityAmenities.js',
    '../../components/reports/locationAmenities.js',
    '../../components/reports/feesDeposits.js',
    '../../components/reports/propertyRankings.js',
    '../../components/reports/marketShare.js'
], function (app) {

    app.controller('reportingController', ['$scope','$rootScope','$location','$propertyService', function ($scope,$rootScope,$location,$propertyService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "Reporting";

        $rootScope.sideMenu = []

        $scope.options = { hideSearch: true, dropdown: true, labelAvailable: "Available Comps", labelSelected: "Selected Comps", searchLabel: "Comps" }
        $scope.reportOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Reports", labelSelected: "Selected Reports", searchLabel: "Reports" }

        $scope.reportItems = []
        $scope.reportItems.push({id: "property_rankings", name: "Property Rankings", selected:false});
        $scope.reportItems.push({id: "market_share", name: "Market Share", selected:true});
        $scope.reportItems.push({id: "community_amenities", name: "Community Amenities", selected:false});
        $scope.reportItems.push({id: "location_amenities", name: "Location Amenities", selected:false});
        $scope.reportItems.push({id: "fees_deposits", name: "Fees & Deposits", selected:false});


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
            $scope.reportLoading = false;
            $scope.noReports = false;
            delete $scope.reports;

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

        $scope.run = function() {
            $scope.reportLoading = true;
            $scope.noReports = false;

            $scope.selectedComps = _.filter($scope.items,function(x) {return x.selected == true})

            var reportIds = _.pluck(_.filter($scope.reportItems,function(x) {return x.selected == true}),"id");
            var compids =  _.pluck($scope.selectedComps,"id")

            if (reportIds.length == 0) {
                $scope.noReports = true;
                $scope.reportLoading = false;
                return;
            }

            $scope.rankings = reportIds.indexOf("property_rankings") > -1;
            $scope.marketShare = reportIds.indexOf("market_share") > -1;

            $propertyService.reports(
                compids
                , $scope.selectedProperty._id
                ,reportIds
            ).then(function(response) {
                    $scope.reportLoading = false;
                    $scope.reports = response.data;

                });
        }


    }]);
});