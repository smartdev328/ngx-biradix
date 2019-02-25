'use strict';
define([
    'app',
    'async',
], function (app,async) {
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

            $scope.originalRoles = [];

            $scope.getDropdowns = function () {
                $scope.loading = true;

                $userService.getRolesToAssign().then(function(response) {
                    $scope.roles = response.data;
                    $scope.roles.unshift({name: 'Please select a role', _id:""});
                        // Remove guests from non-admins
                        if ($rootScope.me.permissions.indexOf("Admin") === -1) {
                            _.remove($scope.roles, function(r) {
                                return r.name === "Guest";
                            });
                        }

                    if (userId) {
                        $scope.user.roles.forEach(function(r) {
                            r.selectedRole = _.find($scope.roles, function(x) {
                                return r._id.toString() == x._id.toString();
                            });
                        });
                    } else {
                        $scope.user.roles[0].selectedRole = $scope.roles[0];
                    }

                    async.each($scope.user.roles, function(role, callback) {
                        $scope.getProps(role,true);
                        callback();
                    }, function(err) {
                        $scope.loading = false;
                    });
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

                    $scope.originalRoles = _.map($scope.user.roles, function(x) {return x._id.toString()});

                    async.each($scope.user.roles, function(role, callback) {
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


            $scope.listProperties = function(properties) {
                return properties.map(function(p) {
                   return "<B>" + p.name + "</B>";
                }).join("<Br>");
            };

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

                    $scope.isGuest = $scope.user.roles[0].selectedRole.name == "Guest";
                    var criteria = {limit: 10000, permission: 'PropertyManage', select:"_id name orgid", active: true};

                    if ($scope.isGuest) {
                        criteria.ids = $scope.user.roles[0].propertyids;
                        criteria.noorgid = true;
                        criteria.permission = 'CompManage';
                    } else {
                        criteria.orgid = role.selectedRole.orgid;
                    }

                    criteria.hideCustom = true;

                    $propertyService.search(criteria).then(function (response) {
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

                var rolesChanged = _.difference($scope.originalRoles, $scope.user.roleids).length || _.difference($scope.user.roleids, $scope.originalRoles).length;

                if (err) {
                    toastr.error("Please select a role.");
                    return;

                }

                $scope.loading = true;

                if ($rootScope.me.permissions.indexOf('Admin') > -1) {
                    $scope.user.defaultRole = $scope.user.roleids[0];
                }


                if (!userId) {
                    $scope.user.isGuest = $scope.user.roles[0].selectedRole.name == "Guest";

                    $userService.create($scope.user).then(function (response) {
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                $scope.loading = false;
                            }
                            else {
                                $scope.saveProperties(response.data.user,selectedProperties, true);
                            }
                        },
                        function (error) {
                            toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this alert. <br> Very sorry for the trouble. <a href='javascript:location.reload();'>click here</a> to refresh");
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
                                $scope.saveProperties(response.data.user,selectedProperties, rolesChanged);
                            }
                        },
                        function (error) {
                            toastr.error("Unable to update. Please contact the administrator.");
                            $scope.loading = false;
                        });
                }

            }

            $scope.saveProperties = function(user, properties,rolesChanged) {
                $propertyUsersService.setPropertiesForUser(user._id,properties,rolesChanged).then(function(response) {
                        window.setTimeout(function() {
                            $uibModalInstance.close(user);
                        }, 2000);
                    },
                    function(error) {
                        toastr.error("Unable to update properties. Please contact the administrator.");
                        $scope.loading = false;
                    });
            }

            $scope.allowedRoles = function(index){
                return function(item){
                    if (index == 0 || !item.tags) {
                        return true
                    }

                    return item.tags[0] == 'PO';
                };
            };

            $scope.rolesTooltip = function() {
                var string = "";
                if (_.find($scope.roles, function(x) {
                    return x.name === "Corporate Manager";
                    })) {
                    string += "<span class='roles_info'><B>Corporate Manager</B> - The Corporate Manager has full access to the BI:Radix platform. This role includes all functionality available to other roles as well as additional administrative functions and access to all users and properties in the organization.</span><Br><Br>";
                }
                if (_.find($scope.roles, function(x) {
                        return x.name === "Regional Manager";
                    })) {
                    string += "<span class='roles_info'><B>Regional Manager</B> - The Regional Manager is typically responsible for a group of properties and their property managers. This role includes all the functionality of Property Manager role and is setup to administer multiple properties and users associated with those properties.</span><Br><Br>";
                }
                if (_.find($scope.roles, function(x) {
                        return x.name === "Property Manager";
                    })) {
                    string += "<span class='roles_info'><B>Property Manager</B> - The Property Manager typically manages one property.  This role can manage the properties assigned to them and users associated with those properties.</span><Br><Br>";
                }
                if (_.find($scope.roles, function(x) {
                        return x.name === "Property Owner";
                    })) {
                    string += "<span class='roles_info'><B>Property Owner</B> - The Property Owner is typically assigned to property stakeholders who want visibility and access to reporting. This role has read-only access to the properties assigned to them. </span><Br><Br>";
                }
                return string;
            };
        }]);
});
