'use strict';
define(['app'], function (app) {
    app.factory('$cookieSettingsService', ['$cookies', function ($cookies) {
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
                return JSON.parse($cookies.get('Graphs') || "false")
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


        fac.getDaterange = function () {
            return {
                Ranges : {
                    'Last 30 Days': [moment().subtract(29, 'days'), moment().endOf("day")],
                    'Last 90 Days': [moment().subtract(89, 'days'), moment().endOf("day")],
                    'Last Year': [moment().subtract(1, 'year'), moment().endOf("day")],
                    'Lifetime': [moment().subtract(30, 'year'), moment().endOf("day")],
                },
                selectedRange : $cookies.get('selectedRange') || "Last 90 Days",
                selectedStartDate : moment($cookies.get('selectedStartDate')),
                selectedEndDate : moment($cookies.get('selectedEndDate'))
            }
        }

        fac.saveDaterange = function (daterange) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('selectedStartDate', daterange.selectedStartDate.format(), {expires : expireDate})
            $cookies.put('selectedEndDate', daterange.selectedEndDate.format(), {expires : expireDate})
            $cookies.put('selectedRange', daterange.selectedRange, {expires : expireDate})
        }

        return fac;
    }]);
});