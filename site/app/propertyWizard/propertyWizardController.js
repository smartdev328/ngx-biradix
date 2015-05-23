'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('propertyWizardController', ['$scope', '$modalInstance', 'id', 'isComp', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, isComp, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            if (!id && isComp) {
                $scope.title = "Create Comp Property"
            } else {
                $scope.title = "Create Subject Property"
            }


            $scope.steps = [
                {label:'Property Info', template: 'propertyInfo.html'},
                {label:'Amenities', template: 'amenities.html'},
                {label:'Fees & Deposits', template: 'feesDeposits.html'},
                {label:'Floor Plans', template: 'floorPlans.html'},
                {label:'Notes', template: 'notes.html'},
            ]


            $scope.changeStep = function(i) {
                if (i < 0) {
                    i = 0;
                }

                if (i >= $scope.steps.length) {
                    i = $scope.steps.length - 1;
                }
                $scope.stepIndex = i;
                $scope.stepTemplate = '/app/propertyWizard/tabs/' + $scope.steps[i].template;

            }

            $scope.changeStep(0);
            $scope.property = { }
        }]);
});