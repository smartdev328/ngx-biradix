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


            $scope.fix = function(daterange) {
                if (daterange) {
                    daterange = {
                        selectedRange: daterange.selectedRange,
                        selectedStartDate: daterange.selectedStartDate ? moment(daterange.selectedStartDate._d).format() : null,
                        selectedEndDate: daterange.selectedEndDate ? moment(daterange.selectedEndDate._d).format() : null,
                        enabled: daterange.enabled
                    }
                }

                return daterange;
            }

            for (var k in copyOfSettings) {

                var d = $scope.fix(copyOfSettings[k].daterange);
                if (d) {copyOfSettings[k].daterange = d}
                d = $scope.fix(copyOfSettings[k].daterange1);
                if (d) {copyOfSettings[k].daterange1 = d}
                d = $scope.fix(copyOfSettings[k].daterange2);
                if (d) {copyOfSettings[k].daterange2 = d}

                if (reportIds.indexOf("property_report") > -1 &&
                    (
                        k == "dashboardSettings" || k == "profileSettings" || k == "showProfile"
                    )) {}
                else if (reportIds.indexOf("concession") > -1 && k == "concession") {}
                else if (reportIds.indexOf("property_rankings_summary") > -1 && k == "rankingsSummary") {}
                else if (reportIds.indexOf("property_rankings") > -1 && k == "rankings") {}
                else if (reportIds.indexOf("property_status") > -1 && k == "propertyStatus") {}
                else if (reportIds.indexOf("trends") > -1 && k == "trends") {}
                else {
                    delete copyOfSettings[k];
                }
            }

            console.log(copyOfSettings);

            $scope.report = {
                name: currentReport ? currentReport.name : '',
                reportIds: reportIds,
                reportNames: reportNames,
                settings: copyOfSettings,
                type: type,
                share: currentReport && currentReport.orgid ? true : false
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

                            var msg = "";
                            if ($scope.report.share === true) {
                                msg = 'A shared report <b>' +  $scope.report.name +'</b> already exists. Are you sure you want to update the existing report?<br><br>To save a new report, please click "No" and change the name of the report. <br><br>'
                            } else {
                                msg = 'Report <b>' +  $scope.report.name +'</b> already exists. Are you sure you want to update the existing report?<br><br>To save a new report, please click "No" and change the name of the report. <br><br>'
                            }

                            $dialog.confirm(msg, function() {
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