'use strict';
define([
    'app',
    '../../services/userService.js',
], function (app) {
     app.controller
        ('updatePasswordController', ['$scope', '$modalInstance', 'me', '$userService', 'ngProgress', '$rootScope','toastr', '$location', function ($scope, $modalInstance, me, $userService, ngProgress, $rootScope, toastr, $location) {
            $scope.alerts = [];
            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            window.document.title = "Account Profile - Update Password | BI:Radix";

            if (!me.passwordUpdated) {
                $scope.alerts.push({ type: 'warning', msg: 'For security purposes, please update the temporary password assigned to you.'});
            }
            
            $scope.user = {  }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.submit = function (user) {
                $scope.alerts = [];
                if (user.newpassword != user.confirmpassword) {
                    $scope.alerts.push({ type: 'danger', msg: 'Passwords do not match.'});
                    return;
                }
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $userService.updatePassword(user).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            $scope.alerts.push({ type: 'danger', msg: e.msg});
                        })

                    }
                    else {
                        toastr.success('Password updated successfully.');
                        $modalInstance.close();
                    }

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });
            }
        }]);
});