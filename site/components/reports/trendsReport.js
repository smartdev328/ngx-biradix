angular.module('biradix.global').directive('trendsReport', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                settings: '=',
                offset: "="
            },
            controller: function ($scope, $element, $reportingService) {
                $scope.excludedPopups = {};
                // Highcharts.Pointer.prototype.reset = function () {
                //     return undefined;
                // };

                $scope.cbLegendClicked = function(legend) {
                    $scope.legendUpdated = legend;
                }

                $scope.$watch('report', function(a,b){
                    $scope.options = {};
                    if ($scope.report) {

                        $scope.d1 = $reportingService.getDateRangeLabel($scope.settings.daterange1, $scope.offset);
                        $scope.d2 = $reportingService.getDateRangeLabel($scope.settings.daterange2, $scope.offset);

                        var height = 300;
                        var printWidth = 1100;

                        $scope.options.nersqft = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 2, metric: 'nersqft', title: "Net Effective Rent / Sqft", emptyMaxX: 1}
                        $scope.options.ner = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 0, metric: 'ner', title: "Net Effective Rent", emptyMaxX: 1000}
                        $scope.options.rent = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 0, metric: 'rent', title: "Rent", emptyMaxX: 1000}
                        $scope.options.rentsqft = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 2, metric: 'rentsqft', title: "Rent / Sqft", emptyMaxX: 1}
                        $scope.options.runrate = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 0, metric: 'runrate', title: "Recurring Rent", emptyMaxX: 1000}
                        $scope.options.runratesqft = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 2, metric: 'runratesqft', title: "Recurring Rent / Sqft", emptyMaxX: 1}
                        $scope.options.atr = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'atr', title: "ATR %", emptyMaxX: 100}
                        $scope.options.occupancy = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'occupancy', title: "Occupancy %", emptyMaxX: 100}

                        $scope.options.leased = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'leased', title: "Leased %", emptyMaxX: 100}
                        $scope.options.renewal = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'renewal', title: "Renewal %", emptyMaxX: 100}
                        $scope.options.traffic = {height:height, printWidth:printWidth, prefix: '', suffix: '', decimalPlaces: 0, metric: 'traffic', title: "Traffic / Week", emptyMaxX: 10}
                        $scope.options.leases = {height:height, printWidth:printWidth, prefix: '', suffix: '', decimalPlaces: 0, metric: 'leases', title: "Leases / Week", emptyMaxX: 10}
                        $scope.options.concessions = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 0, metric: 'concessions', title: "Total Concessions", emptyMaxX: 1000}

                    }

                });
            },
            templateUrl: '/components/reports/trendsReport.html?bust=' + version
        };
    })
