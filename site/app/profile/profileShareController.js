'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModal', '$uibModalInstance', 'propertyName',
    function($scope, $rootScope, $location, $uibModal, $uibModalInstance, propertyName) {
        if (!$rootScope.loggedIn) {
            $location.path('/login');
        }

        $scope.propertyName = propertyName;

        $scope.localLoading = true;

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);
});