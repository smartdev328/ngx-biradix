"use strict";
define([
    "app",
], function(app) {
     app.controller("bulkFloorplansController", ["$scope", "$uibModalInstance","$dialog","toastr", function ($scope, $uibModalInstance, $dialog, $toastr) {
        ga("set", "title", "/bulkFloorPlans");
        ga("set", "page", "/bulkFloorPlans");
        ga("send", "pageview");

        $scope.newFloorplans = [];
         $scope.cancel = function() {
             if ($scope.newFloorplans.length > 0) {
                 $dialog.confirm("You have uploaded floor plans that have not been saved. Are you sure you want to close without saving?", function () {
                     $uibModalInstance.dismiss("cancel");
                 }, function() {
                 });
             } else {
                 $uibModalInstance.dismiss("cancel");
             }
         };

        $scope.processFile = function(upload) {
            var file = upload.files[0];
            var reader = new FileReader();
             reader.onload = function(e) {
                var data = e.target.result;

                var workbook = XLSX.read(data, {type: "binary"});

                 var worksheet = workbook.Sheets[workbook.SheetNames[0]];
                 var headers = [worksheet["A1"] ? worksheet["A1"].v : "", worksheet["B1"] ? worksheet["B1"].v : "", worksheet["C1"] ? worksheet["C1"].v : "", worksheet["D1"] ? worksheet["D1"].v : "", worksheet["E1"] ? worksheet["E1"].v : ""];
                 if (headers[0] !== "Bedrooms" && headers[1] !== "Bathrooms" && headers[2] !== "Description" && headers[3] !== "Unit Count" && headers[4] !== "SqFt") {
                     $toastr.error("Header row in excel file must have the following columns in order: Bedrooms, Bathrooms, Description, Unit Count, SqFt");
                 } else {
                     // TODO: More error checking
                     $scope.newFloorplans = [1];
                 }
            };
            reader.readAsBinaryString(file);
        };
    }]);
});
