"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplans", ["$scope", "$uibModalInstance", "$dialog", "toastr", function ($scope, $uibModalInstance, $dialog, toastr) {
        ga("set", "title", "/IncorrectFloorplans");
        ga("set", "page", "/IncorrectFloorplans");
        ga("send", "pageview");

        $scope.incorrectFloorplansArray = [];

        $scope.cancel = function() {
            if ($scope.incorrectFloorplansArray.name) {
                $dialog.confirm("You have uploaded floor plans that have not been saved. Are you sure you want to close without saving?", function () {
                    $uibModalInstance.dismiss("cancel");
                }, function() {
                });
            } else {
                $uibModalInstance.dismiss("cancel");
            }
        };

        $scope.done = function() {
           console.log($scope.incorrectFloorplansArray);
        };

        $scope.processFile = function(upload) {
            $scope.incorrectFloorplansArray.floorplans = [];
            var file = upload.files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var errors = [];
                var tempFloorplans = [];

                var workbook = XLSX.read(e.target.result, {type: "binary"});

                $scope.incorrectFloorplansArray.name = workbook.SheetNames[0];

                var worksheet = workbook.Sheets[workbook.SheetNames[0]];
                var headers = [worksheet["A1"] ? worksheet["A1"].v : "", worksheet["B1"] ? worksheet["B1"].v : "", worksheet["C1"] ? worksheet["C1"].v : "", worksheet["D1"] ? worksheet["D1"].v : "", worksheet["E1"] ? worksheet["E1"].v : ""];
                if (headers[0] !== "Bedrooms" && headers[1] !== "Bathrooms" && headers[2] !== "Description" && headers[3] !== "Unit Count" && headers[4] !== "SqFt") {
                    $toastr.error("Header row in excel file must have the following columns in order: Bedrooms, Bathrooms, Description, Unit Count, SqFt");
                } else {
                    var data = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                    var fp;
                    $scope.canUpload = false;
                    for (var i = 1; i < data.length; i++) {
                        if (data[i][0] === "" && data[i][1] === "") {
                        } else if (data[i][0] === "" || isNaN(data[i][0])) {
                            errors.push("Row " + (i + 1) + ": Bedrooms is not valid");
                        } else if (data[i][1] === "" || isNaN(data[i][1])) {
                            errors.push("Row " + (i + 1) + ": Bathrooms is not valid");
                        } else if (data[i][3] === "" || isNaN(data[i][3])) {
                            errors.push("Row " + (i + 1) + ": Unit Count is not valid");
                        } else if (data[i][4] === "" || isNaN(data[i][4])) {
                            errors.push("Row " + (i + 1) + ": Sqft is not valid");
                        } else {
                            fp = {};
                            fp.bedrooms = parseInt(data[i][0]);
                            fp.bathrooms = data[i][1].toString();
                            fp.description = data[i][2] || "";
                            fp.units = parseInt(data[i][3]);
                            fp.sqft = parseInt(data[i][4]);
                            fp.amenities = [];

                            if (fp.bedrooms > 6) {
                                fp.error = "Bedrooms must be less that 7";
                            } else if (fp.bedrooms < 0) {
                                fp.error = "Bedrooms must be greater than or equal to zero";
                            } else if (fp.bathrooms > 9) {
                                fp.error = "Bathrooms must be less than 11";
                            } else if (fp.bathrooms < 1) {
                                fp.error = "Bathrooms must be greater than zero";
                            } else if (fp.units < 1) {
                                fp.error = "Unit Count must be greater than zero";
                            } else if (fp.sqft < 1) {
                                fp.error = "Sqft values must be greater than zero";
                            }

                            tempFloorplans.push(fp);
                        }
                    }
                }

                if (errors.length === 0 && tempFloorplans.length === 0) {
                    errors.push("No floor plans found in file");
                }

                if (errors.length > 0) {
                    toastr.error("<b>Unable to upload floor plans for the following reason(s):</b><Br><Br>" + errors.join("<Br>"), {timeOut: 10000, extendedTimeOut: 10000});
                } else {
                    $scope.incorrectFloorplansArray.floorplans = _.sortByAll(tempFloorplans, ['bedrooms','bathrooms','sqft','description','units']);

                    $scope.instructions = false;
                }
                upload.value = null;
            };
            reader.readAsBinaryString(file);
        };

    }]);
});