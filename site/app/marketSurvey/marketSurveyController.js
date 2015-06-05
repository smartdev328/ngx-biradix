'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('marketSurveyController', ['$scope', '$modalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $propertyService.search({
                limit: 1,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name floorplans contactName contactEmail phone"
            }).then(function (response) {
                $scope.property = response.data.properties[0]
                $scope.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                $scope.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                $scope.hasPhone = $scope.property.phone && $scope.property.phone.length > 0;
                $scope.hasContact = $scope.hasName || $scope.hasEmail || $scope.hasPhone;


                $scope.localLoading = true;

            });



}]);

});