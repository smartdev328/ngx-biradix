'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$modalInstance', 'me', '$authService', 'ngProgress', function ($scope, $modalInstance, me, $authService, ngProgress) {
            $scope.alerts = [];
            
            $scope.user = { FirstName: me.first, LastName: me.last, EmailAddress: me.email }

            $scope.canUpdateEmail = true//me.permissions.CanUpdateEmail;
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.submit = function (user) {
                $scope.alerts = [];
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();
                $authService.updateAccount(user).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    if (resp.data.Errors && resp.data.Errors.length > 0) {
                        $scope.alerts.push({ type: 'danger', msg: resp.data.Errors.join("<br>") });
                    }
                    else {
                        $scope.alerts.push({ type: 'success', msg: "Account updated successfully." });
                        me.Last = user.LastName;
                        me.First = user.FirstName;
                        me.Email = user.EmailAddress;
                    }
                    
                    ngProgress.reset();
                }, function (err) {
                    $scope.alerts.push({ type: 'danger', msg: "Unable to update your account. Please contact the administrator." });
                    ngProgress.reset();
                });
            }
        }]);
});