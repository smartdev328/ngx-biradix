'use strict';
define([
    'app',
    '../../services/userService.js',
    '../../services/propertyUsersService.js',
], function (app) {
     app.controller
        ('managePropertyUsersController', ['$scope', '$uibModalInstance', 'property', '$userService', 'ngProgress','$propertyService','$propertyUsersService','toastr', function ($scope, $uibModalInstance, property, $userService, ngProgress,$propertyService,$propertyUsersService,toastr) {

            $scope.property = property;
            $scope.users = [];
            $scope.userOptions = { hideSearch: true, dropdown: false, dropdownDirection : 'left', searchLabel: "Users" }

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            ga('set', 'title', "/assignUsers");
            ga('set', 'page', "/assignUsers");
            ga('send', 'pageview');


            $scope.loading = true;

            $propertyUsersService.getPropertyAssignedUsers(property._id).then(function (response) {

                    var users = response.data.users;

                    $userService.search({active: true, orgid: property.orgid, roleTypes:['RM','BM','PO']}).then(function (response) {
                            response.data.users.forEach(function(u) {
                                $scope.users.push({id: u._id, name: u.name, selected: users.indexOf(u._id.toString()) > -1});
                            });

                            $scope.users = _.sortBy($scope.users, function(x) {return (x.group || '') + x.name});

                            $scope.userOptions.hideSearch =  $scope.users.length < 10;
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
                var users  = _.pluck(_.filter($scope.users, function(x) {return x.selected == true}),"id");
                $propertyUsersService.setUsersForProperty(property._id,users)
                $uibModalInstance.close();

            }

        }]);
});