'use strict';
define([
    'app',
    '../../services/userService.js',
    '../../services/propertyService.js',
    '../../services/propertyUsersService.js',
    '../../components/filterlist/module.js',
], function (app) {
     app.controller
        ('editUserController', ['$scope', '$modalInstance', 'userId', '$userService', 'ngProgress','$propertyService','$propertyUsersService', function ($scope, $modalInstance, userId, $userService, ngProgress,$propertyService,$propertyUsersService) {
            $scope.alerts = [];

            $scope.user = {};
            $scope.properties = [];
            $scope.propertyOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', searchLabel: "Properties" }

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

                        $scope.getProps();

                    },
                    function (error) {
                        $scope.loading = false;
                        $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                    });



            };

            if (userId) {
                $scope.loading = true;
                $userService.search({_id:userId, select: "_id first last email"}).then(function (response) {
                        $scope.user = response.data.users[0];

                        $propertyUsersService.getUserAssignedProperties(userId).then(function (response) {
                                $scope.propertyids = response.data.properties;

                                $scope.getDropdowns();
                            },
                            function (error) {
                                $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                                $scope.loading = false;
                            });
                    },
                    function (error) {
                        $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                        $scope.loading = false;
                    });
            }
            else {
                $scope.getDropdowns();
            }


            $scope.getProps = function() {
                $scope.loading = true;

                if (!$scope.selectedRole._id || $scope.selectedRole.isadmin || $scope.selectedRole.tags.indexOf('CM') > -1) {
                    $scope.properties = [];
                    $scope.loading = false;
                } else {
                    $propertyService.search({limit: 1000, permission: 'PropertyView', select:"_id name orgid", orgid: $scope.selectedRole.orgid, active: true}).then(function (response) {
                        $scope.properties = [];
                        response.data.properties.forEach(function(x) {
                            $scope.properties.push({id: x._id, name: x.name, selected: $scope.propertyids.indexOf(x._id.toString()) > -1 });
                        });

                        $scope.propertyOptions.hideSearch = $scope.properties.length < 10;

                        $scope.loading = false;
                    })

                }


            }

            $scope.save = function() {
                $scope.alerts = [];
                if (!$scope.selectedRole._id) {
                    return $scope.alerts.push({ type: 'danger', msg: "Please select a role." });
                }

                $scope.loading = true;
                $scope.user.roleid=$scope.selectedRole._id;

                var selectedProperties = [];

                if ($scope.properties) {
                    selectedProperties = _.pluck(_.filter($scope.properties, function(x) {return x.selected == true}),"id");
                }

                if (!userId) {
                    $userService.create($scope.user).then(function (response) {
                            if (response.data.errors) {
                                $scope.alerts.push({
                                    type: 'danger',
                                    msg: _.pluck(response.data.errors, 'msg').join("<br>")
                                });
                            }
                            else {
                                $scope.saveProperties(response.data.user._id,selectedProperties);
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
                    $userService.update($scope.user).then(function (response) {
                            if (response.data.errors) {
                                $scope.alerts.push({
                                    type: 'danger',
                                    msg: _.pluck(response.data.errors, 'msg').join("<br>")
                                });
                            }
                            else {
                                $scope.saveProperties(response.data.user._id,selectedProperties);
                                $modalInstance.close(response.data.user);
                            }
                        },
                        function (error) {
                            $scope.alerts.push({
                                type: 'danger',
                                msg: "Unable to update. Please contact the administrator."
                            });
                        });
                }

                $scope.loading = false;

            }

            $scope.saveProperties = function(userid, properties) {
                $propertyUsersService.setPropertiesForUser(userId,properties)
            }

        }]);
});