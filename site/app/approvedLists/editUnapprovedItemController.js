"use strict";
define([
    "app",
], function(app) {
     app.controller("editUnapprovedItemController", ["$scope", "$uibModalInstance", "row", "ngProgress", "toastr", "$dialog", "$approvedListsService", "$propertyService", "unapproved",
         function($scope, $uibModalInstance, row, ngProgress, toastr, $dialog, $approvedListsService, $propertyService, unapproved) {
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
            $dialog.confirm("Are you sure you want to update the <b>" + row.typeMap + "</b> of properties currently using the value <b>\"" + row.value + "\"</b> to <b>\"" + row.newValue + "</b>? <Br><br>" + " Properties affected: " + row.count, function() {
                var propertyIds = _.map(unapproved, function(x) {
                    return x.id.toString();
                });
                $propertyService.massUpdate(propertyIds, row.type, row.newValue, row.value).then(function(response) {
                    if (response.data.error) {
                        toastr.error(response.data.error);
                    } else {
                        $uibModalInstance.close();
                    }
                }, function() {
                    toastr.error("An error has occurred");
                });
            });
        };
    }]);
});
