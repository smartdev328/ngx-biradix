'use strict';
define([
    'app',
], function(app) {
    app.controller('profileShareController', ['$scope', '$rootScope', '$location', '$uibModal', '$uibModalInstance', 'ngProgress', 'toastr',
    function($scope, $rootScope, $location, $uibModal, $uibModalInstance, ngProgress, toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login');
        }

        $scope.localLoading = true;

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);
});