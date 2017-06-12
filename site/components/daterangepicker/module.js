angular.module('biradix.global').directive('daterangePicker', function () {
        return {
            restrict: 'E',
            scope: {
                daterange: '=',
                width: '='
            },
            controller: function ($scope, $element) {

                $scope.populate = function() {
                    if ($scope.daterange.selectedRange == "Custom Range") {
                        $scope.value = $scope.daterange.selectedStartDate.format('MM/DD/YY') + ' - ' + $scope.daterange.selectedEndDate.format('MM/DD/YY')
                    }
                    else {
                        $scope.value = $scope.daterange.selectedRange;
                    }
                }

                if ($scope.daterange.selectedRange == "Custom Range") {
                }
                else {
                    if (!$scope.daterange.Ranges[$scope.daterange.selectedRange]) {
                        $scope.daterange.selectedRange = $scope.daterange.Ranges[0]
                    }
                    $scope.daterange.selectedStartDate = $scope.daterange.Ranges[$scope.daterange.selectedRange][0];
                    $scope.daterange.selectedEndDate = $scope.daterange.Ranges[$scope.daterange.selectedRange][1];
                }

                $scope.populate();

                $($element.find('div')).daterangepicker({
                    format: 'MM/DD/YYYY',
                    startDate: $scope.daterange.selectedStartDate,
                    endDate: $scope.daterange.selectedEndDate,
                    showDropdowns: true,
                    showWeekNumbers: true,
                    timePicker: false,
                    timePickerIncrement: 1,
                    timePicker12Hour: true,
                    ranges: $scope.daterange.Ranges,

                    opens: $scope.daterange.direction || 'left',
                    drops: 'down',
                    buttonClasses: ['btn', 'btn-sm'],
                    applyClass: 'btn-primary',
                    cancelClass: 'btn-default',
                    maxDate : moment().format("MM/DD/YYYY"),
                    minDate : moment().subtract(30, 'year').format("MM/DD/YYYY")
                }, function (start, end, label) {
                    $scope.daterange.selectedStartDate = start;
                    $scope.daterange.selectedEndDate = end;
                    $scope.daterange.selectedRange = label;
                    $scope.populate()

                });
            },
            template: '<div style="width:100%;display:inline-block;background-color:white;border:1px solid #ccc; padding:6px 5px 6px 5px; border-radius: 2px;cursor:pointer;white-space:nowrap;font-weight:initial !important; font-size: 12px !important; color: initial !important;margin-top:0px;"><span class="pull-left" style="color:#337ab7">{{value}}</span><i class="fa fa-caret-down pull-right" style="padding-top:2px"></i></div>'
        };
    })

