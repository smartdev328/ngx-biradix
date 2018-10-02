"use strict";
define([
    "app",
], function(app) {
     app.controller("editUnapprovedItemController", ["$scope", "$uibModalInstance", "row", "ngProgress", "toastr", "$dialog", "$approvedListsService", function($scope, $uibModalInstance, row, ngProgress, toastr, $dialog, $approvedListsService) {
        ga("set", "title", "/editUnapprovedItem");
        ga("set", "page", "/editUnapprovedItem");
        ga("send", "pageview");

        $scope.row = row;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
        $scope.autocompleteApprovedList = function(search, type) {
            return $approvedListsService.read({
                "type": type,
                "searchableOnly": true,
                "search": search,
                "limit": 10,
            }).then(function(result) {
                return result.data.data.ApprovedList;
            });
        };

        $scope.update = function() {
            $dialog.confirm("Are you sure you want to update <i><u>" + row.typeMap + "</u></i> <b>" + row.value + "</b> to <b>" + row.newValue + "</b>? <b><u>" + row.count + " properties will be affected.</u></b>", function() {
                // Todo: Mass Update
            });
        };
    }]);
});
