'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('saveReportController', ['$scope', '$uibModalInstance', 'settings','reportIds', 'ngProgress','toastr','$dialog', function ($scope, $uibModalInstance, settings,reportIds, ngProgress,toastr,$dialog) {

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
                    )) {

                }
                else
                if (reportIds.indexOf(k) == -1) {
                    delete copyOfSettings[k];
                }
            }
            console.log(reportIds);
            console.log(copyOfSettings);

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            ga('set', 'title', "/saveReport");
            ga('set', 'page', "/saveReport");
            ga('send', 'pageview');


        }]);
});