'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModalInstance', '$propertyService', 'comp', 'items', 'ngProgress', 'options', 'toastr',
    function($scope, $rootScope, $location, $uibModalInstance, $propertyService, comp, items, ngProgress, options, toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login');
        }

        $scope.comp = comp;
        $scope.email = '';
        $scope.items = items;
        $scope.itemsUnsorted = items;
        $scope.options = options;

        $scope.localLoading = true;

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.selectedItems = function () {
            var items = {
                floorPlan: [],
                property: [],
            };
            
            $scope.itemsUnsorted.forEach(function(item) {
                if (item.selected) {
                    switch(item.group) {
                        case 'Floor Plan Info':
                            items.floorPlan.push({id: item.id, name: item.name});
                        break;
                        case 'Common Property Info':
                            items.property.push({id: item.id, name: item.name});
                        break;
                    }
                }
            });
            
            return items;
        };
        
        $scope.send = function () {
            if (!$scope.email) {
                toastr.error('Please enter a valid email address');
                return;
            }

            if (!$scope.items.filter(function(item) { return item.selected }).length) {
                toastr.error('Please select data to include');
                return;
            }
            
            ngProgress.start();

            var comp = $scope.comp;
            var email = $scope.email;
            var items = $scope.selectedItems();
            var logo = $rootScope.me.orgs[0].logoBig;

            $propertyService.emailProperty(
                comp,
                email,
                items,
                logo
            ).then(function(response) {
                ngProgress.complete();
                $uibModalInstance.dismiss();
                toastr.success('Property data for ' + comp.name + ' emailed to ' + email);
            }, function(error) {
                ngProgress.complete();
                toastr.error('Property data for ' + comp.name + ' not emailed. Please try again or contact support for assistance');
            });
        };
    }]);
});