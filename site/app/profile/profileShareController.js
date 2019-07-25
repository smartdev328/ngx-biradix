'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModalInstance', 'items', 'options', 'propertyName',
    function($scope, $rootScope, $location, $uibModalInstance, items, options, propertyName) {
        if (!$rootScope.loggedIn) {
            $location.path('/login');
        }

        $scope.items = items;
        $scope.options = options;
        $scope.propertyName = propertyName;

        $scope.localLoading = true;

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);
});