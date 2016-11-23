'use strict';
define([
    'app',
    'async2',
    '../../services/userService.js',
    '../../services/propertyService.js',
    '../../services/propertyUsersService.js',
], function (app,async2) {
     app.controller
        ('editUserController', ['$scope', '$uibModalInstance', 'userId', '$userService', 'ngProgress','$propertyService','$propertyUsersService','toastr','$rootScope', function ($scope, $uibModalInstance, userId, $userService, ngProgress,$propertyService,$propertyUsersService,toastr,$rootScope) {
            $scope.user = {roles:[{propertyids:[]}]};

            $scope.userId = userId;
            $scope.loading = true;

            ga('set', 'title', "/editUser");
            ga('set', 'page', "/editUser");
            ga('send', 'pageview');

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.addRole = function() {
                $scope.user.roles.push({selectedRole : $scope.roles[0], propertyids:[]});
            }

            $scope.getDropdowns = function () {
                $scope.loading = true;

                $userService.getRolesToAssign().then(function (response) {
                        $scope.roles = response.data;
                        $scope.roles.unshift({name: 'Please select a role', _id:""})

                        if (userId) {
                            $scope.user.roles.forEach(function(r) {
                                r.selectedRole = _.find($scope.roles, function (x) {
                                    return r._id.toString() == x._id.toString()
                                })

                            })
                        }
                        else {

                            $scope.user.roles[0].selectedRole = $scope.roles[0];
                        }

                        async2.each($scope.user.roles, function(role, callback) {
                            $scope.getProps(role,true);
                            callback();
                        }, function (err) {
                            $scope.loading = false;
                        })


                    },
                    function (error) {
                        $scope.loading = false;
                        toastr.error("Unable to retrieve data. Please contact the administrator.");
                    });
            };

            if (userId) {
                $scope.loading = true;
                $userService.search({_id:userId, select: "_id first last email"}).then(function (response) {
                        $scope.user = response.data.users[0];


                        async2.each($scope.user.roles, function(role, callback) {
                            role.propertyids = [];

                            $propertyUsersService.getUserAssignedProperties(userId).then(function (response) {
                                    role.propertyids = response.data.properties;

                                    $scope.getDropdowns();
                                    callback();
                                },
                                function (error) {
                                    callback(error);
                                });
                        }, function(err) {
                            if (err) {
                                toastr.error("Unable to retrieve data. Please contact the administrator.");
                            }
                            $scope.loading = false;
                        });


                    },
                    function (error) {
                        toastr.error("Unable to retrieve data. Please contact the administrator.");
                        $scope.loading = false;
                    });
            }
            else {
                $scope.getDropdowns();
            }


            $scope.getProps = function(role, first) {
                $scope.loading = true;
                role.properties = [];
                role.propertyOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', searchLabel: "Properties" }

                if (!role.selectedRole._id || role.selectedRole.isadmin || role.selectedRole.tags.indexOf('CM') > -1) {
                    role.properties = [];
                    if (!first) {
                        $scope.loading = false;
                    }
                } else {
                    $propertyService.search({limit: 10000, permission: 'PropertyManage', select:"_id name orgid", orgid: role.selectedRole.orgid, active: true}).then(function (response) {
                        role.properties = [];

                        response.data.properties.forEach(function(x) {
                            role.properties.push({id: x._id, name: x.name, selected: role.propertyids.indexOf(x._id.toString()) > -1 || (response.data.properties.length == 1 && !userId)});
                        });

                        role.propertyOptions.hideSearch = role.properties.length < 10;

                        if (!first) {
                            $scope.loading = false;
                        }
                    })

                }


            }

            $scope.save = function() {
                $scope.user.roleids = [];
                var selectedProperties = [];
                var err = false;
                $scope.user.roles.forEach(function(r) {
                    if (!r.selectedRole._id) {
                        err = true;
                    }


                    $scope.user.roleids.push(r.selectedRole._id);

                    if (r.properties) {
                        selectedProperties = selectedProperties.concat(_.pluck(_.filter(r.properties, function(x) {return x.selected == true}),"id"));
                    }

                })

                $scope.user.roleids = _.uniq($scope.user.roleids);
                selectedProperties = _.uniq(selectedProperties);

                if (err) {
                    toastr.error("Please select a role.");
                    return;

                }

                $scope.loading = true;

                if ($rootScope.me.permissions.indexOf('Admin') > -1) {
                    $scope.user.defaultRole = $scope.user.roleids[0];
                }


                if (!userId) {
                    $userService.create($scope.user).then(function (response) {
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                $scope.loading = false;
                            }
                            else {
                                $scope.saveProperties(response.data.user,selectedProperties);
                            }
                        },
                        function (error) {
                            toastr.error("Unable to create. Please contact the administrator.");
                            $scope.loading = false;
                        });
                }
                else {
                    $userService.update($scope.user).then(function (response) {
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                $scope.loading = false;
                            }
                            else {
                                $scope.saveProperties(response.data.user,selectedProperties);
                            }
                        },
                        function (error) {
                            toastr.error("Unable to update. Please contact the administrator.");
                            $scope.loading = false;
                        });
                }

            }

            $scope.saveProperties = function(user, properties) {
                $propertyUsersService.setPropertiesForUser(user._id,properties).then(function(response) {
                    window.setTimeout(function() {$uibModalInstance.close(user)}, 1000) ;
                },
                    function (error) {
                        toastr.error("Unable to update properties. Please contact the administrator.");
                        $scope.loading = false;
                    })
            }

            $scope.allowedRoles = function(index){
                return function(item){
                    if (index == 0 || !item.tags) {
                        return true
                    }

                    return item.tags[0] == 'PO';
                }
            }

        }]);
});