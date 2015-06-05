'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('findCompController', ['$scope', '$modalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name comps.id"
            }).then(function (response) {
                $scope.subject = response.data.properties[0]
                $scope.exclude = _.pluck($scope.subject.comps,"id");

                $scope.localLoading = true;

            });

            $scope.create = function () {
                $modalInstance.dismiss('create');
            };

            $scope.autoComplete = function() {
                if ($scope.findComp.length > 1) {
                    $propertyService.search({search: $scope.findComp, active: true, exclude: $scope.exclude}).then(function (response) {
                        $scope.properties = response.data.properties;
                    });
                }
            }

            $scope.link = function(comp) {
                ngProgress.start();
                $propertyService.linkComp(id, comp._id).then(function (resp) {
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        var errors = resp.data.errors
                        toastr.error(errors);
                    }
                    else {
                        $modalInstance.close(comp);
                    }


                }, function (err) {
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });
            }

}]);

});