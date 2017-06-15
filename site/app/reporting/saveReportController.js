'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('saveReportController', ['$scope', '$uibModalInstance', 'settings','reportIds', 'type', 'currentReport', 'reportNames', 'ngProgress','toastr','$dialog','$saveReportService', function ($scope, $uibModalInstance, settings,reportIds, type, currentReport, reportNames, ngProgress,toastr,$dialog,$saveReportService) {

            ga('set', 'title', "/saveReport");
            ga('set', 'page', "/saveReport");
            ga('send', 'pageview');

            var copyOfSettings = _.cloneDeep(settings);

            for (var k in copyOfSettings) {
                if (copyOfSettings[k].daterange) {
                    copyOfSettings[k].daterange = {
                        selectedRange: copyOfSettings[k].daterange.selectedRange,
                        selectedStartDate: copyOfSettings[k].daterange.selectedStartDate ? moment(copyOfSettings[k].daterange.selectedStartDate._d).format() : null,
                        selectedEndDate: copyOfSettings[k].daterange.selectedEndDate ? moment(copyOfSettings[k].daterange.selectedEndDate._d).format() : null
                    }
                }

                if (reportIds.indexOf("property_report") > -1 &&
                    (
                        k == "dashboardSettings" || k == "profileSettings" || k == "showProfile"
                    )) {}
                else if (reportIds.indexOf("concession") > -1 && k == "concession") {}
                else if (reportIds.indexOf("property_rankings_summary") > -1 && k == "rankingsSummary") {}
                else if (reportIds.indexOf("property_rankings") > -1 && k == "rankings") {}
                else {
                    delete copyOfSettings[k];
                }
            }

            $scope.report = {
                name: currentReport ? currentReport.name : '',
                reportIds: reportIds,
                reportNames: reportNames,
                settings: copyOfSettings,
                type: type
            }

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.save = function(bOverride) {

                $('button.contact-submit').prop('disabled', true);

                $scope.report.override = bOverride

                $saveReportService.upsert($scope.report).then(function (response) {
                        $('button.contact-submit').prop('disabled', false);
                        if (response.data.existing) {
                            $dialog.confirm('Report <b>' +  $scope.report.name +'</b> already exists. Are you sure you want to update the existing report?<br><br>To save a new report, please click "No" and change the name of the report. <br><br>', function() {
                                $scope.save(true);
                            }, function() {})
                        }
                        else if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                        }
                        else {
                            if (bOverride) {
                                toastr.success("<B>" + $scope.report.name + "</B> report updated successfully.");
                            } else {
                                toastr.success("<B>" + $scope.report.name + "</B> report saved successfully.");
                            }
                            $uibModalInstance.close(response.data.report);
                        }
                    },
                    function (error) {
                        $('button.contact-submit').prop('disabled', false);
                        toastr.error("Unable to save report. Please contact the administrator.");
                    });

            }


        }]);
});