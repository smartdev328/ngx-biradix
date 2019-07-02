angular.module('biradix.global').directive('propertyReport', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                me: '=',
                dashboardSettings: '=',
                profileSettings: '=',
                showProfile: '=',
                bedrooms: '=',
                bedroom: '=',
            },
            controller: function ($scope,$propertyService) {
                $scope.excludedPopups = {};
                var resp = $propertyService.parseDashboard($scope.report.dashboard,$scope.dashboardSettings.summary, $scope.me.settings.showLeases, $scope.dashboardSettings.nerScale, $scope.dashboardSettings.selectedBedroom);

                $scope.property = resp.property;
                $scope.comps = resp.comps;

                $scope.compItems = 0;
                for (var c in $scope.dashboardSettings.show) {
                    if ($scope.dashboardSettings.show[c] === true) {
                        $scope.compItems ++;
                    }
                }
                $scope.stretchComps = $scope.compItems >= 10 || ($scope.compItems >= 9 && $scope.dashboardSettings.show.weekly === true)

                if ($scope.comps.length > 13) {
                    $scope.stretchComps = true;
                }
                $scope.mapOptions = resp.mapOptions;
                $scope.bedrooms = resp.bedrooms;
                $scope.bedroom = resp.bedroom;

                $scope.points = resp.points;
                $scope.nerData = resp.nerData;
                $scope.occData = resp.occData;
                $scope.leasedData = resp.leasedData;

                $scope.profiles = [];

                $scope.columns = ['occupancy'];

                if ($scope.me.settings.showLeases) {
                    $scope.columns.push('leased');
                }
                if ($scope.me.settings.showRenewal) {
                    $scope.columns.push('renewal');
                }

                if ($scope.me.settings.showATR) {
                    $scope.columns.push('atr');
                }

                $scope.columns.push('leases');
                $scope.columns.push('traffic');

                $scope.report.profiles.forEach(function(p) {
                    resp = $propertyService.parseProfile(p,$scope.profileSettings.graphs,$scope.me.settings.showLeases, $scope.me.settings.showRenewal, $scope.dashboardSettings.nerScale,$scope.me.settings.showATR);

                    $scope.profiles.push({
                        lookups : resp.lookups,
                        property : resp.property,
                        comp : resp.comp,
                        points : resp.points,
                        surveyData : resp.surveyData,
                        nerData : resp.nerData,
                        occData : resp.occData,
                        otherData : resp.otherData,
                        nerKeys : resp.nerKeys,
                        otherTable : resp.otherTable
                    });
                })

            },
            templateUrl: '/components/reports/propertyReport.html?bust=' + version
        };
    })
