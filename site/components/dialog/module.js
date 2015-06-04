'use strict';
define(['app'], function (app) {
    app.factory('$dialog', ['$modal', function ($modal) {
            var svc = {};

            svc.confirm = function (msg,confirm,deny) {
                var modalInstance = $modal.open({
                    templateUrl: '/components/dialog/confirm.html',
                    controller: function($scope, $modalInstance){
                        $scope.msg = msg;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.confirm = function () {
                            $modalInstance.close('confirm');
                        };
                    }
                });


                modalInstance.result.then(function () {
                    return confirm();
                }, function () {
                    return deny();

                });
            }

            return svc;
        }]);
});