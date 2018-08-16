'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('saveReportController', ['$scope', '$uibModalInstance', 'settings','reportIds', 'type', 'currentReport', 'reportNames', 'ngProgress','toastr','$dialog','$saveReportService', function ($scope, $uibModalInstance, settings,reportIds, type, currentReport, reportNames, ngProgress,toastr,$dialog,$saveReportService) {
            ga('set', 'title', "/saveReport");
            ga('set', 'page', "/saveReport");
            ga('send', 'pageview');

            var copyOfSettings = $saveReportService.cleanSettings(settings, reportIds);

            $scope.report = {
                name: currentReport ? currentReport.name : '',
                reportIds: reportIds,
                reportNames: reportNames,
                settings: copyOfSettings,
                type: type,
                share: currentReport && currentReport.orgid ? true : false
            }

            console.log($scope.report);
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
                            toastr.error(_.pluck(response.data.errors, "msg").join("<br>"));
                        }
                        else {
                            if (bOverride) {
                                toastr.success("<B>" + $scope.report.name + "</B> custom report template updated successfully.");
                            } else {
                                toastr.success("<B>" + $scope.report.name + "</B> custom report template saved successfully.");
                            }
                            $uibModalInstance.close(response.data.report);
                        }
                    },
                    function(error) {
                        $('button.contact-submit').prop('disabled', false);
                        toastr.error("Unable to save template. Please contact the administrator.");
                    });

            }
        }]);
});