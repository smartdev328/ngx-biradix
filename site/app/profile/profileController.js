'use strict';
define([
    'app',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../services/progressService'
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', '$window','$cookies', 'ngProgress', '$progressService', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams, $window, $cookies, ngProgress, $progressService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = ''
        $rootScope.sideMenu = [];

        $scope.setRenderable = function() {
            window.setTimeout(function() {
                window.renderable = true;
            },100)
        }

        $scope.propertyId = $stateParams.id;

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $propertyService.search({limit: 1, permission: 'PropertyManage', _id: defaultPropertyId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits location_amenities community_amenities floorplans"
                }).then(function (response) {
                    $scope.lookups = response.data.lookups;
                    $scope.property = response.data.properties[0];
                    $scope.localLoading = true;
                    $window.document.title = $scope.property.name;
                    $scope.setRenderable();

                    $scope.property.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                    $scope.property.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                    $scope.property.hasNotes = $scope.property.notes && $scope.property.notes.length > 0;
                    $scope.property.hasContact = $scope.property.hasName || $scope.property.hasEmail;
                    $scope.property.notes = $scope.property.notes.replace(/(?:\r\n|\r|\n)/g, '<br />');

                    $scope.property.hasFees = false;
                    if ($scope.property.fees) {
                        for (var fee in $scope.property.fees) {
                            if ($scope.property.fees[fee].length > 0) {
                                $scope.property.hasFees = true;
                            }
                        }
                    }

                    $scope.property.location_am = [];
                    $scope.property.location_amenities.forEach(function(la) {
                        var am = _.find($scope.lookups.amenities, function(a) {return a._id.toString() == la.toString()})
                        if (am) {
                            $scope.property.location_am.push(am.name)
                        }
                    })

                    $scope.property.community_am = [];
                    $scope.property.community_amenities.forEach(function(la) {
                        var am = _.find($scope.lookups.amenities, function(a) {return a._id.toString() == la.toString()})
                        if (am) {
                            $scope.property.community_am.push(am.name)
                        }
                    })

                    $scope.property.floorplan_am = [];
                    $scope.property.floorplans.forEach(function(fp) {
                        fp.amenities.forEach(function(la) {
                            var am = _.find($scope.lookups.amenities, function(a) {return a._id.toString() == la.toString()})
                            if (am) {
                                if ($scope.property.floorplan_am.indexOf(am.name) == -1)
                                    $scope.property.floorplan_am.push(am.name)
                            }
                        })
                    })

                });
            }
        };

        $scope.loadProperty($scope.propertyId)


        $scope.print = function() {
            $window.print();
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

        $scope.excel = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + $scope.progressId

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

        $scope.pdf = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.property._id + '/pdf?'
            url += "token=" + $cookies.get('token')
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + $scope.progressId

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

    }]);
});