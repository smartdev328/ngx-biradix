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

                $userService.getRolesToAssign().then(function (response) {
                        $scope.roles = response.data;
                        $scope.roles.unshift({name: 'Please select a role', _id:""})

                        if (userId) {
                            $scope.selectedRole = _.find($scope.roles, function (x) {
                                return $scope.user.roleid.toString() == x._id.toString()
                            })
                        }
                        else {

                            $scope.selectedRole = $scope.roles[0];
                        }

                    },
                    function (error) {
                        $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                    });


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

            $scope.save = function() {
                $scope.alerts = [];
                if (!$scope.selectedRole._id) {
                    return $scope.alerts.push({ type: 'danger', msg: "Please select a role." });
                }

                $scope.loading = true;
                $scope.user.roleid=$scope.selectedRole._id;

                if (!userid) {
                    $userService.create($scope.user).then(function (response) {
                            if (response.data.errors) {
                                $scope.alerts.push({
                                    type: 'danger',
                                    msg: _.pluck(response.data.errors, 'msg').join("<br>")
                                });
                            }
                            else {
                                $modalInstance.close(response.data.user);
                            }
                        },
                        function (error) {
                            $scope.alerts.push({
                                type: 'danger',
                                msg: "Unable to create. Please contact the administrator."
                            });
                        });
                }
                else {
                    //TODO: Update user
                }

                $scope.loading = false;

            }

        }]);
});