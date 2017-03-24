'use strict';
define([
    'app',
    '../../components/propertyProfile/comps',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../components/propertyProfile/floorplans',
    '../../components/propertyProfile/tableView',
    '../../components/googleMap/module',
    '../../services/cookieSettingsService'
], function (app) {

    app.controller('fullController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService', '$stateParams','$cookies', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$stateParams,$cookies) {
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.summary = $cookieSettingsService.getSummary();

        $scope.graphs = $cookieSettingsService.getGraphs();

        $scope.nerScale = $cookieSettingsService.getNerScale();

        $scope.totals = $cookieSettingsService.getTotals();

        $scope.selectedBedroom = $cookieSettingsService.getBedrooms();

        $scope.orderByFp = "sqft";

        if ($cookies.get("fp.o")) {
            $scope.orderByFp = $cookies.get("fp.o");
        }

        $scope.show = {description:true,units:true,unitPercent:true,sqft:true,rent:true,concessions:true,ner:true,nersqft:true,mersqft: false}
        if ($cookies.get("fp.s")) {
            $scope.show = JSON.parse($cookies.get("fp.s"));
        }

        $scope.orderByComp = "number";

        if ($cookies.get("cmp.o")) {
            $scope.orderByComp = $cookies.get("cmp.o");
        }


        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {

                $scope.showComp = {
                    units: true,
                    unitPercent: false,
                    occupancy: true,
                    leased: $rootScope.me.settings.showLeases,
                    renewal: $rootScope.me.settings.showRenewal,
                    sqft: true,
                    rent: true,
                    concessions: true,
                    ner: true,
                    nersqft: true,
                    mersqft: false,
                    weekly:false
                }
                
                if ($cookies.get("cmp.s")) {
                    $scope.showComp = JSON.parse($cookies.get("cmp.s"));
                }

                $scope.compItems = 0;
                for (var c in $scope.showComp) {
                    if ($scope.showComp[c] === true) {
                        $scope.compItems ++;
                    }
                }
                $scope.stretchComps = $scope.compItems >= 10 || ($scope.compItems >= 9 && $scope.showComp.weekly === true)

                $scope.showProfile = {
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
                    leased: $rootScope.me.settings.showLeases,
                    renewal: $rootScope.me.settings.showRenewal,
                    traf: true,
                    lease: true
                }
                if ($cookies.get("pr.s")) {
                    $scope.showProfile = JSON.parse($cookies.get("pr.s"));
                }

                me();
                $scope.loadProperty($stateParams.id)
            }
        });

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $scope.localLoading = false;

                $propertyService.full(
                    defaultPropertyId
                    , $scope.summary
                    , $scope.selectedBedroom
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                        }
                    ,{graphs: $scope.graphs, scale: $scope.nerScale }
                ).then(function (response) {
                    var resp = $propertyService.parseDashboard(response.data.dashboard,$scope.summary, $rootScope.me.settings.showLeases, $scope.nerScale, $scope.selectedBedroom);

                    window.document.title = resp.property.name + " - Profile + Comps | BI:Radix";

                    $scope.property = resp.property;
                    $scope.comps = resp.comps;

                    if ($scope.comps.length > 13) {
                        $scope.stretchComps = true;
                    }

                    $scope.coverPage = {
                        date: moment().format("MMM Do, YYYY"),
                        reports: ['Profile Report w/Comps: ' + $scope.property.name],
                        org: $rootScope.me.orgs[0]
                    }

                    $scope.mapOptions = resp.mapOptions;
                    $scope.bedrooms = resp.bedrooms;
                    $scope.bedroom = resp.bedroom;;

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;
                    $scope.leasedData = resp.leasedData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;

                        $scope.profiles = [];

                    $scope.columns = ['occupancy'];

                    if ($rootScope.me.settings.showLeases) {
                        $scope.columns.push('leased');
                    }
                    if ($rootScope.me.settings.showRenewal) {
                        $scope.columns.push('renewal');
                    }

                    $scope.columns.push('leases');
                    $scope.columns.push('traffic');

                    var resp;
                    response.data.profiles.forEach(function(p) {
                        resp = $propertyService.parseProfile(p,$scope.graphs,$rootScope.me.settings.showLeases, $rootScope.me.settings.showRenewal, $scope.nerScale);

                        $scope.profiles.push({
                            lookups : resp.lookups,
                            property : resp.property,
                            comp : resp.comp,
                            points : resp.points,
                            surveyData : resp.surveyData,
                            nerData : resp.nerData,
                            occData : resp.occData,
                            otherData : resp.otherData,
                            nerKeys : resp.nerKeys,
                            otherTable : resp.otherTable
                        });
                    })

                    $scope.setRenderable();
                }, function(error) {
                    window.renderable = true;
                });
            }
        };


        $scope.setRenderable = function() {
            if (!phantom) {
                //window.setTimeout(function () {
                //    window.print();
                //}, 2000)
            }
            else {
                window.setTimeout(function () {
                    window.renderable = true;
                }, 2000)
            }
        }

    }]);
});