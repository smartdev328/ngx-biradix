angular.module('biradix.global').factory('$saveReportService', ['$http','$cookies', function ($http,$cookies) {
    var fac = {};

    var fix = function(daterange) {
        if (daterange) {

            var start = null;
            if (daterange.selectedStartDate) {
                if (daterange.selectedStartDate._isUTC) {
                    start = moment(daterange.selectedStartDate._d).subtract(daterange.selectedStartDate._offset, 'minute').format();;
                } else {
                    start = moment(daterange.selectedStartDate._d).format();
                }
            }

            var end = null;
            if (daterange.selectedEndDate) {
                if (daterange.selectedEndDate._isUTC) {
                    end = moment(daterange.selectedEndDate._d).subtract(daterange.selectedEndDate._offset, 'minute').endOf("day").format();;
                } else {
                    end = moment(daterange.selectedEndDate._d).endOf("day").format();
                }
            }

            daterange = {
                selectedRange: daterange.selectedRange,
                selectedStartDate: start,
                selectedEndDate: end,
                enabled: daterange.enabled
            }

        }



        return daterange;
    }

    fac.cleanSettings = function(settings, reportIds) {
        var copyOfSettings = _.cloneDeep(settings);

         for (var k in copyOfSettings) {

            var d = fix(copyOfSettings[k].daterange);
            if (d) {copyOfSettings[k].daterange = d}
            d = fix(copyOfSettings[k].daterange1);
            if (d) {copyOfSettings[k].daterange1 = d}
            d = fix(copyOfSettings[k].daterange2);
            if (d) {copyOfSettings[k].daterange2 = d}

            if (reportIds.indexOf("property_report") > -1 &&
                (
                    k == "dashboardSettings" || k == "profileSettings" || k == "showProfile"
                )) {}
            else if (reportIds.indexOf("concession") > -1 && k == "concession") {}
            else if (reportIds.indexOf("property_rankings_summary") > -1 && k == "rankingsSummary") {}
            else if (reportIds.indexOf("property_rankings") > -1 && k == "rankings") {}
            else if (reportIds.indexOf("property_status") > -1 && k == "propertyStatus") {}
            else if (reportIds.indexOf("custom_portfolio") > -1 && k == "customPortfolio") {}
            else if (reportIds.indexOf("trends") > -1 && k == "trends") {}
            else {
                delete copyOfSettings[k];
            }
        }

        return copyOfSettings;
    }


    fac.upsert = function (report) {
        return $http.post('/api/1.0/reporting/save/upsert'+ '?bust=' + (new Date()).getTime(), report, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.update = function (report) {
        return $http.post('/api/1.0/reporting/save/update'+ '?bust=' + (new Date()).getTime(), report, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.read = function () {
        return $http.get('/api/1.0/reporting/save'+ '?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.remove = function (reportId) {
        return $http.delete('/api/1.0/reporting/save/'+ reportId + '?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    return fac;
}]);
