angular.module('biradix.global').factory('$cookieSettingsService', ['$cookies', function ($cookies) {
        var fac = {};

        fac.getSurveyGuestOption = function (propertyid) {

            var SurveyGuestOption = {}
            try {
                SurveyGuestOption = JSON.parse($cookies.get('SurveyGuestOption') || {})
            } catch(ex) {

            }

            return SurveyGuestOption[propertyid];

        }

        fac.saveSurveyGuestOption = function(propertyid, value) {
            var SurveyGuestOption = {}
            try {
                SurveyGuestOption = JSON.parse($cookies.get('SurveyGuestOption') || {})
            } catch(ex) {

            }

            SurveyGuestOption[propertyid] = value

            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('SurveyGuestOption', JSON.stringify(SurveyGuestOption), {expires : expireDate})
        }


        fac.getBedrooms = function () {

            var v = $cookies.get('Bedrooms') || "-1";

            if (isNaN(v)) {
                v= -1;
            }

            v = parseInt(v);

            return v;

        }

        fac.saveBedrooms = function(bedrooms) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('Bedrooms', bedrooms, {expires : expireDate})
        }

        fac.getSummary = function () {

            try {
                return JSON.parse($cookies.get('Summary') || "true")
            } catch(ex) {
                return true;
            }

        }

        fac.getTotals = function () {
            try {
                return JSON.parse($cookies.get('Totals') || "false")
            } catch(ex) {
                return false;
            }
        }

        fac.saveSummary = function(summary) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('Summary', summary, {expires : expireDate})
        }

        fac.getGraphs = function () {
            try {
                return JSON.parse($cookies.get('Graphs') || "true")
            } catch(ex) {
                return true;
            }
        }

        fac.saveGraphs = function(graphs) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('Graphs', graphs, {expires : expireDate})
        }

        fac.saveTotals = function(totals) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('Totals', totals, {expires : expireDate})
        }

        fac.getNerScale = function () {
            try {
                return $cookies.get('Scale') || "ner"
            } catch(ex) {
                return "ner";
            }
        }

        fac.saveNerScale = function(graphs) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('Scale', graphs, {expires : expireDate})
        }

        fac.defaultDateObject = function(selectedRange,selectedStartDate,selectedEndDate) {
            var r = selectedRange || "Last 90 Days";

             if (r == "Last Year") {
                r = "Year-to-Date";
            }

            return {
                Ranges : {
                    'Last 30 Days': [moment().subtract(30, 'days').startOf("day"), moment().endOf("day")],
                    'Last 90 Days': [moment().subtract(90, 'days').startOf("day"), moment().endOf("day")],
                    'Last 12 Months': [moment().subtract(1, 'year').startOf("day"), moment().endOf("day")],
                    'Year-to-Date': [moment().startOf("year"), moment().endOf("day")],
                    'Lifetime': [moment().subtract(30, 'year').startOf("day"), moment().endOf("day")],
                },
                selectedRange : r,
                selectedStartDate : moment(selectedStartDate),
                selectedEndDate : moment(selectedEndDate)
            }

        }

        fac.getDaterange = function () {
            return fac.defaultDateObject($cookies.get('selectedRange'),$cookies.get('selectedStartDate'),$cookies.get('selectedEndDate'))
        }

        fac.saveDaterange = function (daterange) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('selectedStartDate', daterange.selectedStartDate.format(), {expires : expireDate})
            $cookies.put('selectedEndDate', daterange.selectedEndDate.format(), {expires : expireDate})
            $cookies.put('selectedRange', daterange.selectedRange, {expires : expireDate})
        }

        fac.getNewVersion = function () {
            try {
                return JSON.parse($cookies.get('newVersion') || "false")
            } catch(ex) {
                return true;
            }
        }

        fac.saveNewVersion = function(bool) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('newVersion', bool, {expires : expireDate})
        }

        return fac;
    }]);
