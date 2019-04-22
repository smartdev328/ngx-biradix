angular.module('biradix.global').directive('daterangePicker', function () {
        return {
            restrict: 'E',
            scope: {
                daterange: '=',
                width: '='
            },
            controller: function ($scope, $element) {
                $scope.$watch("daterange", function(newdate) {
                    if (newdate.reload) {
                        newdate.reload = false;
                        $scope.reload();
                    }

                    if (newdate.enabled === false) {
                        $($element.find('div')).css("opacity","0.5");
                        $($element.find('div')).css( 'pointer-events', 'none' );
                    }
                    else
                    if (newdate.enabled === true) {
                        $($element.find('div')).css("opacity","1");
                        $($element.find('div')).css( 'pointer-events', 'auto' );
                    }
                }, true)

                $scope.populate = function() {
                    if ($scope.daterange.selectedRange == "Custom Range") {
                        if(typeof $scope.daterange.selectedStartDate == 'string') {
                            $scope.daterange.selectedStartDate = moment($scope.daterange.selectedStartDate);
                            $scope.daterange.selectedEndDate = moment($scope.daterange.selectedEndDate);
                        }
                        $scope.value = $scope.daterange.selectedStartDate.format('MM/DD/YY') + ' - ' + $scope.daterange.selectedEndDate.format('MM/DD/YY')
                    }
                    else {
                        $scope.value = $scope.daterange.selectedRange;
                    }
                }


                $scope.reload = function() {

                    switch ($scope.daterange.selectedRange) {
                        case "30 Days":
                            $scope.daterange.selectedRange = "Last 30 Days";
                            break;
                        case "90 Days":
                            $scope.daterange.selectedRange = "Last 90 Days";
                            break;
                        case "12 Months":
                            $scope.daterange.selectedRange = "Last 12 Months";
                            break;
                    }

                    if ($scope.daterange.selectedRange == "Custom Range") {
                    }
                    else {
                        if (!$scope.daterange.Ranges[$scope.daterange.selectedRange]) {
                            $scope.daterange.selectedRange = $scope.daterange.Ranges[0];
                        }
                        $scope.daterange.selectedStartDate = $scope.daterange.Ranges[$scope.daterange.selectedRange][0];
                        $scope.daterange.selectedEndDate = $scope.daterange.Ranges[$scope.daterange.selectedRange][1];
                    }

                    $scope.populate();


                    $($element.find('div')).daterangepicker({
                        format: 'MM/DD/YYYY',
                        startDate: $scope.daterange.selectedStartDate,
                        endDate: $scope.daterange.selectedEndDate,
                        showDropdowns: false,
                        showWeekNumbers: false,
                        timePicker: false,
                        timePickerIncrement: 1,
                        timePicker12Hour: true,
                        ranges: $scope.daterange.Ranges,

                        opens: $scope.daterange.direction || 'left',
                        drops: 'down',
                        buttonClasses: ['btn', 'btn-sm'],
                        applyClass: 'btn-primary',
                        cancelClass: 'btn-default',
                        maxDate: moment().format("MM/DD/YYYY"),
                        minDate: moment().subtract(30, 'year').format("MM/DD/YYYY"),
                        linkedCalendars: false,
                    }, function (start, end, label) {
                        $scope.daterange.selectedStartDate = start;
                        $scope.daterange.selectedEndDate = end;
                        $scope.daterange.selectedRange = label;
                        $scope.populate()

                    });
                }

                $scope.reload();
            },
            template: '<div style="width:100%;display:inline-block;background-color:white;border:1px solid #ccc; padding:6px 5px 6px 5px; border-radius: 2px;cursor:pointer;white-space:nowrap;font-weight:initial !important; font-size: 12px; color: initial !important;margin-top:0px;"><span class="pull-left" style="color:#337ab7">{{value}}</span><i class="fa fa-caret-down pull-right" style="padding-top:2px"></i></div>'
        };
    })

angular.module('biradix.global').directive('daterangeCalendar', function () {
    return {
        restrict: 'E',
        scope: {
            settings: '=',
            daysDisabled: '='
        },
        controller: function ($scope, $element) {

            var todaysIsDisabled = $scope.daysDisabled.includes($scope.settings.selectedWeekDate);
            if(todaysIsDisabled) {
                $scope.settings.currentDate = $scope.settings.placeholder;
            } else {
                $scope.settings.currentDate = moment($scope.settings.currentDate).format("MM/DD/YYYY");
            }

            $($element.find('div')).daterangepicker({
                autoUpdateInput: $scope.settings.autoUpdateInput,
                singleDatePicker: $scope.settings.singleDatePicker,
                minDate: moment().format("MM/DD/YYYY"),
                isInvalidDate: function(date) {
                  return ($scope.daysDisabled.includes(date.day()));
                }
            }, function (start, end, label) {
                $scope.settings.selectedWeekDate = moment(start)._d.getDay();
                $scope.settings.currentDate = start.format("MM/DD/YYYY");
            });

        },
        template: '<div style="width:100%;display:inline-block;background-color:white;border:1px solid #ccc; padding:6px 5px 6px 5px; border-radius: 2px;cursor:pointer;white-space:nowrap;font-weight:initial !important; font-size: 12px; color: initial !important;margin-top:0px;"><span class="pull-left" style="color:#337ab7">{{settings.currentDate}}</span><i class="fa fa-caret-down pull-right" style="padding-top:2px"></i></div>'
    };
})