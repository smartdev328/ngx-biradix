'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('floorplanLinksController', ['$scope', '$uibModalInstance', 'id', 'compid',
            function ($scope, $uibModalInstance, id, compid) {

            ga('set', 'title', "/compedFloorPlans");
            ga('set', 'page', "/compedFloorPlans");
            ga('send', 'pageview');
            
            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };


}]);

});
