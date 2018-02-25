'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('cloneController', ['$scope', '$uibModalInstance', 'property','$propertyService', 'ngProgress','toastr', function ($scope, $uibModalInstance, property,$propertyService, ngProgress,toastr) {

            $scope.property = property;
            $scope.comps = true;

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            ga('set', 'title', "/cloneProperty");
            ga('set', 'page', "/cloneProperty");
            ga('send', 'pageview');


            $scope.save = function() {
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $propertyService.clone(property._id,$scope.comps).then(function (response) {
                        $('button.contact-submit').prop('disabled', false);
                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            $uibModalInstance.close();
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        $('button.contact-submit').prop('disabled', false);
                        toastr.error("Unable to update property. Please contact the administrator.");
                        ngProgress.reset();
                    });
            }

        }]);
});