'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('manageCompsController', ['$scope', '$uibModalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            
            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name comps.id"
            }).then(function (response) {
                $scope.subject = response.data.properties[0]

                var compids = _.map($scope.subject.comps,function(x) {return x.id.toString()});

                $propertyService.search({limit: 10000, permission: 'PropertyView', ids: compids, exclude: [id], select:"name address city state"}).then(function (response) {
                    $scope.localLoading = true;
                    $scope.comps = response.data.properties;
                    $scope.comps.forEach(function(c) {
                        c.summary = c.name + "<br><i>" + c.address + ", " + c.city + ", " + c.state + "</i>";
                    })
                });

            });

            $scope.remove = function(comp) {
                _.remove($scope.comps, function(x) {return x._id == comp._id.toString()});
                $scope.search1 = "";

            }

            $scope.getLocation = function (val) {
                var compids = _.map($scope.comps,function(x) {return x._id.toString()});
                return $propertyService.search({search: val, active: true, exclude: compids}).then(function (response) {
                    return response.data.properties
                });
            };

            $scope.searchSelected = function (item, model, label) {
                $scope.comps.push(item);
                $scope.search1 = "";
            }

        }]);

});