'use strict';
define([
    'app',
], function (app) {
    app.factory('$exportService', ['$http','$cookies','$urlService', function ($http,$cookies,$urlService) {
        var fac = {};


        var getPdfUrl = function(showFile,propertyId,graphs, daterange, progressId) {
            var timezone = moment().utcOffset();
            if ($cookies.get("timezone")) {
                timezone = parseInt($cookies.get("timezone"));
            }

            var url = '/api/1.0/properties/' + propertyId + '/pdf?'
            url += "token=" + $cookies.get('token');
            
            var data = {
                Graphs: graphs,
                Scale: $cookies.get('Scale') || "ner",
                selectedStartDate: daterange.selectedStartDate.format(),
                selectedEndDate: daterange.selectedEndDate.format(),
                selectedRange: daterange.selectedRange,
                timezone: timezone,
                progressId: progressId,
                showFile: showFile,
                orderBy: ($cookies.get("fp.o") || ''),
                show: encodeURIComponent($cookies.get("fp.s") || ''),
                showP: encodeURIComponent($cookies.get("pr.s") || '')
            }
            
            return {base:url, data: data};
        }

        fac.print = function (propertyId, showFile, daterange, progressId, graphs) {
            var pdf = getPdfUrl(showFile,propertyId, graphs, daterange, progressId);

            //Has to be synchronous
            var key = $urlService.shorten(JSON.stringify(pdf.data));
            var url = pdf.base + "&key=" + key;

            url += "&bust=" + (new Date()).getTime();

            if (showFile === true) {
                location.href = url;
            }
            else {
                window.open(url);
            }
        }

        return fac;
    }]);
});