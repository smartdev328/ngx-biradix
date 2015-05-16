'use strict';
define([
    'app',
    '../../components/propertyProfile/module'
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = ''
        //window.renderable = true;

        $scope.propertyId = $stateParams.id;

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $propertyService.search({limit: 1, permission: 'PropertyManage', _id: defaultPropertyId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt"
                }).then(function (response) {
                    $scope.property = response.data.properties[0];
                    $scope.localLoading = true;
                });
            }
        };

        $scope.loadProperty($scope.propertyId)

    }]);
});