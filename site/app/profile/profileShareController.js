'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModalInstance', '$propertyService', 'items', 'ngProgress', 'options', 'property', 'survey',
    function($scope, $rootScope, $location, $uibModalInstance, $propertyService, items, ngProgress, options, property, survey) {
        if (!$rootScope.loggedIn) {
            $location.path('/login');
        }

        $scope.email = '';
        $scope.items = items;
        $scope.options = options;
        $scope.property = property;
        $scope.survey = survey;

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
                            items.columns.push({id: item.id, name: item.name});
                        break;
                        case 'General Information':
                            items.information.push({id: item.id, name: item.name});
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
            var logo = $rootScope.me.orgs[0].logoBig;
            var propertyId = $scope.property.id;
            var propertyName = $scope.property.name;
            var propertyPhone = $scope.property.phone;
            var survey = $scope.survey;

            $propertyService.emailProperty(
                email,
                items,
                logo,
                propertyName,
                propertyPhone,
                propertyId,
                survey
            ).then(function(response) {
                ngProgress.complete();
                $uibModalInstance.dismiss();
            }, function(error) {
                ngProgress.complete();
            });
        };
    }]);
});