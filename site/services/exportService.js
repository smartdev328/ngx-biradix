'use strict';
define([
    'app',
    '../../services/urlService.js'
], function (app) {
    app.factory('$exportService', ['$http','$cookies','$urlService', function ($http,$cookies,$urlService) {
        var fac = {};

        var getPdfUrl = function(full, showFile,propertyId,graphs, daterange, progressId) {
            var url = '/api/1.0/properties/' + propertyId + '/pdf?'
            url += "token=" + $cookies.get('token');
            
            var data = {
                Graphs: graphs,
                Summary: $cookies.get('Summary') || "true",
                Scale: $cookies.get('Scale') || "ner",
                selectedStartDate: daterange.selectedStartDate.format(),
                selectedEndDate: daterange.selectedEndDate.format(),
                selectedRange: daterange.selectedRange,
                timezone: moment().utcOffset(),
                progressId: progressId,
                full: full,
                showFile: showFile,
                orderBy: ($cookies.get("fp.o") || ''),
                show: encodeURIComponent($cookies.get("fp.s") || ''),
                orderByC: ($cookies.get("cmp.o") || ''),
                showC: encodeURIComponent($cookies.get("cmp.s") || ''),
                showP: encodeURIComponent($cookies.get("pr.s") || ''),
                bust: + (new Date()).getTime()
            }


            return {base:url, data: data};
        }

        fac.print = function (propertyId, full, showFile, daterange, progressId, graphs) {
            var pdf = getPdfUrl(full, showFile,propertyId, graphs, daterange, progressId);

            $urlService.shorten(JSON.stringify(pdf.data)).then(function(resp) {
                var url = pdf.base + "&key=" + resp.data.key;
                if (showFile === true) {
                    location.href = url;
                }
                else {
                    window.open(url);
                }

            }, function (errors) {
                //TODO: Not sure what to do here.
            })

        }

        return fac;
    }]);
});