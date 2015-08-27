'use strict';
define([
    'app',
    '../../services/userService.js',
], function (app) {
     app.controller
        ('editUserController', ['$scope', '$modalInstance', 'userId', '$userService', 'ngProgress', function ($scope, $modalInstance, userId, $userService, ngProgress) {
            $scope.alerts = [];

            $scope.user = {};

            $scope.userId = userId;
            $scope.loading = true;

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.getDropdowns = function () {
                $scope.loading = true;
                $scope.alerts = [];


                $scope.loading = false;
            };

            if (userId) {
                $scope.loading = true;
                $userService.search({_id:userId, select: "_id first last email"}).then(function (response) {
                        $scope.user = response.data.users[0];

                        $scope.getDropdowns();
                    },
                    function (error) {
                        $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                        $scope.loading = false;
                    });
            }
            else {
                $scope.getDropdowns();
            }

        }]);
});