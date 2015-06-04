'use strict';
define([
    'app',
    '../../components/filterlist/module.js'
], function (app) {
     app.controller
        ('floorplanLinksController', ['$scope', '$modalInstance', 'id', 'compid', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, compid, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                ids: [id, compid],
                select: "_id name comps floorplans"
            }).then(function (response) {
                $scope.subject = _.find(response.data.properties, function(p) {return p._id.toString() == id})
                $scope.comp = _.find(response.data.properties, function(p) {return p._id.toString() == compid})

                $scope.items = [];
                $scope.options = {searchLabel: 'Floor Plans'}

                $scope.comp.floorplans.forEach(function(fp) {
                    var link = {id: fp.id, name: $propertyService.floorplanName(fp), group: $scope.floorplanGroup(fp), selected: false}

                    $scope.items.push(link);
                })


                $scope.localLoading = true;

            });

            $scope.floorplanGroup = function(fp) {
                switch (fp.bedrooms) {
                    case 0:
                        return "Studios";
                    default:
                        return fp.bedrooms + " Bedrooms"
                }
            }

}]);

});