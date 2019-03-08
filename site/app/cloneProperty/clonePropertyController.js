define([
    "app",
], function(app) {
     app.controller("clonePropertyController", ["$scope", "$uibModalInstance", "ngProgress", "$rootScope","toastr", "$location", "$propertyService", "$uibModal", "$dialog", function($scope, $uibModalInstance, ngProgress, $rootScope, toastr, $location, $propertyService, $uibModal, $dialog) {
        if (!$rootScope.loggedIn) {
            $location.path("/login");
        }

        ga("set", "title", "/cloneProperty");
        ga("set", "page", "/cloneProperty");
        ga("send", "pageview");

         $scope.cancel = function() {
             $uibModalInstance.dismiss("cancel");
         };

        $scope.create = function() {
            $uibModalInstance.close("create");
        };

         $scope.getLocation = function(val) {
             return $propertyService.search({search: val, active: true, hideCustom: true}).then(function(response) {
                 return response.data.properties;
             });
         };

         $scope.options = {
             search: "",
         }

         $scope.localLoading = false;
         $scope.searchSelected = function(item, model, label) {
             $scope.options.search = "";
             $dialog.confirm("Are you sure you want to create a custom copy of <b>" + item.name + "</b>?<Br>", function() {
                 $scope.localLoading = true;

                 $propertyService.clone(item._id, false).then(function(response) {
                         $scope.localLoading = false;
                         if (response.data.errors) {
                             toastr.error(_.pluck(response.data.errors, "msg").join("<br>"));
                         } else {
                             $uibModalInstance.close();
                         }

                         ngProgress.reset();
                     },
                     function() {
                         $scope.localLoading = false;
                         toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                         ngProgress.reset();
                     });
             }, function() {
                 $scope.search1 = "";
             });
         };
    }]);
});
