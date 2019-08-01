'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModalInstance', '$propertyService', 'items', 'ngProgress', 'options', 'property',
    function($scope, $rootScope, $location, $uibModalInstance, $propertyService, items, ngProgress, options, property) {
        if (!$rootScope.loggedIn) {
            $location.path('/login');
        }

        $scope.email = '';
        $scope.items = items;
        $scope.options = options;
        $scope.property = property;

        $scope.localLoading = true;

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.selectedItems = function () {
            var items = {
                columns: [],
                information: [],
            };

            $scope.items.forEach(function(item) {
                if (item.selected) {
                    switch(item.group) {
                        case 'Columns':
                            items.columns.push(item.id);
                        break;
                        case 'General Information':
                            items.information.push(item.id);
                        break;
                    }
                }
            });

            return items;
        };
        
        $scope.send = function () {
            ngProgress.start();

            var email = $scope.email;
            var items = $scope.selectedItems();
            var propertyId = $scope.property.id;
            var propertyPhone = $scope.property.phone;

            $propertyService.emailProperty(
                email,
                items,
                propertyPhone,
                propertyId
            ).then(function(response) {
                ngProgress.complete();
                console.log(response)
            }, function(error) {
                ngProgress.complete();
            });
        };
    }]);
});