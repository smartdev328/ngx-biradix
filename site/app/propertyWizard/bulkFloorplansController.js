"use strict";
define([
    "app",
], function(app) {
    app.controller("bulkFloorplansController", ["$scope", "$uibModalInstance", "$dialog", "toastr", "floorplans", function ($scope, $uibModalInstance, $dialog, $toastr, floorplans) {
        ga("set", "title", "/bulkFloorPlans");
        ga("set", "page", "/bulkFloorPlans");
        ga("send", "pageview");

        $scope.newFloorplans = [];
        $scope.canUpload = false;

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
                var errors = [];
                var tempFloorplans = [];

                var workbook = XLSX.read(e.target.result, {type: "binary"});

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
                            fp.description = data[i][2];
                            fp.units = parseInt(data[i][3]);
                            fp.sqft = parseInt(data[i][4]);
                            fp.amenities = [];

                            if (_.find(floorplans, function(f) {
                                return f.bedrooms === fp.bedrooms && f.bathrooms === fp.bathrooms && f.description === fp.description && f.units === fp.units && f.sqft === fp.sqft;
                            })) {
                                fp.duplicate = true;
                            } else {
                                $scope.canUpload = true;
                            }
                            tempFloorplans.push(fp);
                        }
                    }
                }

                if (errors.length === 0 && tempFloorplans.length === 0) {
                    errors.push("No floor plans found in file");
                }

                if (errors.length > 0) {
                    $toastr.error("<b>Unable to upload floor plans for the following reason(s):</b><Br><Br>" + errors.join("<Br>"));
                } else {
                    $scope.newFloorplans = tempFloorplans;
                }
            };
            reader.readAsBinaryString(file);
        };

        $scope.done = function() {
            var good = _.filter($scope.newFloorplans, function(fp) {
                return !fp.duplicate;
            });
            $uibModalInstance.close(good);
        };
    }]);
});
