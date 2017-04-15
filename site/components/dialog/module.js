angular.module('biradix.global').factory('$dialog', ['$uibModal', function ($uibModal) {
            var svc = {};

            svc.confirm = function (msg,confirm,deny) {
                deny = deny || function() {};
                var modalInstance = $uibModal.open({
                    templateUrl: '/components/dialog/confirm.html?bust='+version,
                    controller: function($scope, $uibModalInstance){
                        $scope.msg = msg;
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };

                        $scope.confirm = function () {
                            $uibModalInstance.close('confirm');
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
