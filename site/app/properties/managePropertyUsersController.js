'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('managePropertyUsersController', ['$scope', '$uibModalInstance', 'property', '$userService', 'ngProgress','$propertyService','$propertyUsersService','toastr', function ($scope, $uibModalInstance, property, $userService, ngProgress,$propertyService,$propertyUsersService,toastr) {

            $scope.property = property;
            $scope.users = [];
            $scope.userOptions = { dropdown: false, dropdownDirection : 'left', searchLabel: "Users" }

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            ga('set', 'title', "/assignUsers");
            ga('set', 'page', "/assignUsers");
            ga('send', 'pageview');


            $scope.loading = true;

            $scope.autocompleteusers = function(search,callback) {
                $userService.search({
                    limit: 100,
                    active: true, orgids: [property.orgid, property.orgid_owner], roleTypes:['RM','BM','PO'],
                    search: search
                }).then(function (response) {
                    var u,u2;
                    var items = [];


                    response.data.users.forEach(function (a) {
                        u = {id: a._id, name: a.name, group: a.roles[0].org.name + " (" + (a.roles[0].org._id.toString() === property.orgid.toString() ? "Management" : "Owner") + ")"};
                        items.push(u);
                    })

                    callback(items)
                }, function (error) {
                    callback([]);
                })

            }

            $propertyUsersService.getPropertyAssignedUsers(property._id).then(function (response) {

                    var users = response.data.users;


                    $userService.search({active: true, orgids: [property.orgid, property.orgid_owner], roleTypes:['RM','BM','PO'], ids: users}).then(function (response) {
                            response.data.users.forEach(function(u) {
                                $scope.users.push({id: u._id, name: u.name, group: u.roles[0].org.name + " (" + (a.roles[0].org._id.toString() === property.orgid.toString() ? "Management" : "Owner") + ")"});
                            });

                            $scope.loading = false;
                        },
                        function (error) {
                            $scope.loading = false;
                            toastr.error("Unable to retrieve data. Please contact the administrator.");
                        });
                },
                function (error) {
                    toastr.error("Unable to retrieve data. Please contact the administrator.");
                    $scope.loading = false;
                });


            $scope.save = function() {
                var users  = _.pluck($scope.users,"id");
                $propertyUsersService.setUsersForProperty(property._id,users)
                $uibModalInstance.close();

            }

            $scope.usersDD = {};
            $scope.gotUsersDD = {};
            $scope.getUserDD = function(user) {
                var id = (user.id || user._id).toString();
                if ($scope.usersDD[id]) {
                    return $scope.usersDD[id];
                }

                if (!$scope.gotUsersDD[id]) {
                    $userService.search({
                        limit: 1,
                        _id: id,
                    }).then(function (response) {
                        if (response.data && response.data.users && response.data.users[0]) {
                            $scope.usersDD[id] = "Email: <b>" + response.data.users[0].email + "</b><Br>" +
                                "Role: <b>" + response.data.users[0].roles[0].name + "</b><Br>";
                        } else {
                            $scope.usersDD[id] = "<B>N/A</B>";
                        }
                    });

                    $scope.gotUsersDD[id] = true;
                }

                return "<center><img src='/images/squares.gif' class='squares'></center>";
            };

        }]);
});