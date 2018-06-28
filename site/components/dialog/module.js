angular.module("biradix.global").factory("$dialog", ["$uibModal", function ($uibModal) {
            var svc = {};

            svc.confirm = function (msg,confirm,deny) {
                deny = deny || function() {};
                var modalInstance = $uibModal.open({
                    templateUrl: "/components/dialog/confirm.html?bust="+version,
                    size: "md",
                    keyboard: false,
                    backdrop: "static",                    
                    controller: function($scope, $uibModalInstance){
                        $scope.msg = msg;
                        $scope.cancel = function() {
                            $uibModalInstance.dismiss("cancel");
                        };

                        $scope.confirm = function() {
                            $uibModalInstance.close("confirm");
                        };
                    },
                });


                modalInstance.result.then(function() {
                    return confirm();
                }, function () {
                    return deny();

                });
            }

    svc.warning = function (msg,confirm,deny) {
        deny = deny || function() {};
        var modalInstance = $uibModal.open({
            templateUrl: "/components/dialog/warning.html?bust="+version,
            size: "md",
            keyboard: false,
            backdrop: "static",
            controller: function($scope, $uibModalInstance){
                $scope.msg = msg;
                $scope.cancel = function () {
                    $uibModalInstance.dismiss("cancel");
                };

                $scope.confirm = function () {
                    $uibModalInstance.close("confirm");
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
