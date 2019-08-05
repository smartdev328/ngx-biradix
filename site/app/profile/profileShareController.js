'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModalInstance', '$propertyService', 'items', 'ngProgress', 'options', 'property', 'survey', 'toastr',
    function($scope, $rootScope, $location, $uibModalInstance, $propertyService, items, ngProgress, options, property, survey, toastr) {
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
            var property = $scope.property;
            var survey = $scope.survey;

            $propertyService.emailProperty(
                email,
                items,
                logo,
                property,
                survey
            ).then(function(response) {
                ngProgress.complete();
                $uibModalInstance.dismiss();
                toastr.success('Property data for ' + property.name + ' emailed to ' + email);
            }, function(error) {
                ngProgress.complete();
                toastr.error('Property data for ' + property.name + ' not emailed. Please try again or contact support for assistance');
            });
        };
    }]);
});