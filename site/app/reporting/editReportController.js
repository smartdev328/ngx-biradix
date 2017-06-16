'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('editReportController', ['$scope', '$uibModalInstance', 'report', 'ngProgress','toastr','$dialog','$saveReportService', function ($scope, $uibModalInstance, report, ngProgress,toastr,$dialog,$saveReportService) {

            ga('set', 'title', "/editReport");
            ga('set', 'page', "/editReport");
            ga('send', 'pageview');

            $scope.report = _.cloneDeep(report);


            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };


            $scope.delete = function() {
                $('button.contact-submit').prop('disabled', true);

                $dialog.confirm('Are you sure you want to delete <b>' +  report.name +'</b>?', function() {
                    $saveReportService.remove(report._id).then(function (response) {
                            $('button.contact-submit').prop('disabled', false);
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                            } else {
                                toastr.success("<B>" + report.name + "</B> report deleted successfully.");

                                $uibModalInstance.close({newReport: report,deleted: true});
                            }
                        },
                        function (error) {
                            $('button.contact-submit').prop('disabled', false);
                            toastr.error("Unable to delete report. Please contact the administrator.");
                        });
                }, function() {
                    $('button.contact-submit').prop('disabled', false);
                })

            }

            $scope.save = function(bOverride) {

                $('button.contact-submit').prop('disabled', true);

                $saveReportService.update($scope.report).then(function (response) {
                        $('button.contact-submit').prop('disabled', false);

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                        }
                        else {
                            toastr.success("<B>" + $scope.report.name + "</B> report updated successfully.");

                            $uibModalInstance.close({newReport: response.data.report,deleted: false});
                        }
                    },
                    function (error) {
                        $('button.contact-submit').prop('disabled', false);
                        toastr.error("Unable to update report. Please contact the administrator.");
                    });

            }
        }]);
});