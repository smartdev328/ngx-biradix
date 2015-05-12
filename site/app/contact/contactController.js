'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('contactController', ['$scope', '$modalInstance', 'me', 'ngProgress', '$rootScope','toastr', '$location', function ($scope, $modalInstance, me, ngProgress, $rootScope, toastr, $location) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.submit = function (msg) {
                $('button.contact-submit').prop('disabled', true);
                $scope.msg.name = me.first + ' ' + me.last;
                $scope.msg.email = me.email;
                ngProgress.start();
                $siteService.contact(msg).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.reset();
                    $scope.done = true;
                });
            }
        }]);
});