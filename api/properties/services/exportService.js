var PropertyService = require('../../properties/services/propertyService')
var organizationService = require('../../organizations/services/organizationService')
var queueService = require('./queueService');
var _ = require("lodash")
var async = require("async");
var moment = require('moment')
const averagesService = require("../../../build/averages/services/averagesService");

module.exports = {
    getCsv: function(operator, subdomain, endDate, callback) {
        var string = "Property,Subject/Comp,CompFor,UnitType,Date,Units,Units %,Sqft,Market Rent,Concess. / 12mo,Net Eff. Rent,NER/Sqft,Occupancy %,Traffic,Leases,Address,City,State,ZipCode,Construction,Year Built,Total Units\r\n";

        organizationService.read(function (err, orgs) {
                var allianceid = _.find(orgs, function (x) {
                    return x.subdomain == subdomain
                })._id;

                PropertyService.search(operator, {
                    limit: 10000,
                    permission: 'PropertyManage',
                    orgid: allianceid,
                    active: true,
                    select: "_id name survey zip active date totalUnits yearBuild address city state zip"
                }, function (err, props) {
                    async.eachLimit(props, 1, function (prop, callbackp) {
                        queueService.getDashboard({
                            user: operator,
                            params: {id: prop._id},
                            body: {
                                show: {},
                                skipPoints: true,
                                injectFloorplans: false,
                                surveyDateStart: endDate == null ? null : '1970-1-1',
                                surveyDateEnd: endDate,
                                daterange: {},
                            },
                        }, function (err, dashboard) {
                            var b, t;
                            if (prop.totalUnits && prop.totalUnits > 0 && dashboard.comps.length > 1) {
                                dashboard.comps.forEach(function (c, i) {
                                    if(c.survey.date) {
                                        for (b in c.survey.bedrooms) {
                                            t = c.survey.bedrooms[b];
                                            string += (csvEncode(c.name));
                                            string += (',' + (i == 0 ? 'Subject' : 'Comp'));
                                            string += (',' + csvEncode(prop.name))
                                            string += (',' + (b == 0 ? 'Studio' : b + ' Bdrs'))
                                            string += ("," + moment(c.survey.date).utcOffset(-480).format("MM/DD/YYYY"));
                                            string += ("," + t.totUnits);
                                            string += ("," + Math.round(t.totUnits / c.survey.totUnits * 100 * 100) / 100);
                                            string += ("," + t.sqft);
                                            string += ("," + t.rent);
                                            string += ("," + t.concessions);
                                            string += ("," + t.ner);
                                            string += ("," + t.nersqft);
                                            string += ("," + Math.round(c.survey.occupancy * 100) / 100);
                                            string += ("," + c.survey.weeklytraffic);
                                            string += ("," + c.survey.weeklyleases);
                                            string += ("," + c.address);
                                            string += ("," + c.city);
                                            string += ("," + c.state);
                                            string += ("," + c.zip);
                                            string += ("," + c.constructionType);
                                            string += ("," + c.yearBuilt);
                                            string += ("," + c.survey.totUnits);
                                            string += ("\r\n")
                                        }
                                    }


                                })
                            }

                            callbackp();
                        });

                    }, function () {
                        callback(string);
                    })

                })

            })        
        
    },
    getCsvGrouped: function(operator, subdomain, endDate, callback) {
        let string = "Property,Subject/Comp,CompFor,UnitType,Date,Units,Sqft,Market Rent,Total Concessions,Net Eff. Rent,NER/Sqft,Occupancy %,Traffic,Leases,Address,City,State,ZipCode,Construction,Year Built\r\n";

        organizationService.read(function (err, orgs) {
            const allianceid = _.find(orgs, function (x) {
                return x.subdomain == subdomain
            })._id;

            PropertyService.search(operator, {
                limit: 10000,
                permission: 'PropertyManage',
                orgid: allianceid,
                active: true,
                select: "_id name survey zip active date totalUnits yearBuild address city state zip"
            }, function (err, props) {
                async.eachLimit(props, 1, function (prop, callbackp) {
                    queueService.getDashboard({
                        user: operator,
                        params: {id: prop._id},
                        body: {
                            show: {},
                            skipPoints: true,
                            injectFloorplans: false,
                            surveyDateStart: endDate == null ? null : '1970-1-1',
                            surveyDateEnd: endDate,
                            daterange: {},
                        },
                    }, function (err, dashboard) {
                        var b, t;
                        var bedrooms = {};
                        var subjectData = [];
                        var compData = [];
                        var subjectStatic = {};
                        var compPropertyLevelData = [];
                        if (prop.totalUnits && prop.totalUnits > 0 && dashboard.comps.length > 1) {
                            dashboard.comps.forEach(function(c, i) {
                                if (c.survey.date) {
                                    if (i > 0) {
                                        compPropertyLevelData.push({
                                            occupancy: c.survey.occupancy,
                                            weeklytraffic: c.survey.weeklytraffic,
                                            weeklyleases: c.survey.weeklyleases,
                                        });
                                    }
                                    for (b in c.survey.bedrooms) {
                                        t = c.survey.bedrooms[b];
                                        if (i > 0) {
                                            bedrooms[b] = bedrooms[b] || [];
                                            bedrooms[b].push(t);
                                            compData.push(t);
                                        } else {
                                            subjectData.push(t);
                                            subjectStatic.date = c.survey.date;
                                            subjectStatic.occupancy = c.survey.occupancy;
                                            subjectStatic.weeklytraffic = c.survey.weeklytraffic;
                                            subjectStatic.weeklyleases = c.survey.weeklyleases;
                                            subjectStatic.address = c.address;
                                            subjectStatic.city = c.city;
                                            subjectStatic.state = c.state;
                                            subjectStatic.zip = c.zip;
                                            subjectStatic.constructionType = c.constructionType;
                                            subjectStatic.yearBuilt = c.yearBuilt;

                                            string += (csvEncode(prop.name));
                                            string += (",Subject");
                                            string += ("," + csvEncode(prop.name));
                                            string += ("," + (b == 0 ? "Studio" : b + " Bdrs"));
                                            string += ("," + moment(c.survey.date).utcOffset(-480).format("MM/DD/YYYY"));
                                            string += ("," + t.totUnits);
                                            string += ("," + t.sqft);
                                            string += ("," + t.rent);
                                            string += ("," + t.concessions);
                                            string += ("," + t.ner);
                                            string += ("," + t.nersqft);
                                            string += ("," + Math.round(c.survey.occupancy * 100) / 100);
                                            string += ("," + c.survey.weeklytraffic);
                                            string += ("," + c.survey.weeklyleases);
                                            string += ("," + c.address);
                                            string += ("," + c.city);
                                            string += ("," + c.state);
                                            string += ("," + c.zip);
                                            string += ("," + c.constructionType);
                                            string += ("," + c.yearBuilt);
                                            string += ("\r\n");
                                        }
                                    }
                                }
                            });
                            let averages;
                            let compAverages;
                            for (let b in bedrooms) {
                                averages = averagesService.average(bedrooms[b]);
                                string += ("Comp Average, Comp");
                                string += ("," + csvEncode(prop.name))
                                string += ("," + (b === "0" ? "Studio" : b + " Bdrs"))
                                string += ",";
                                string += ("," + averages.totUnits);
                                string += ("," + averages.sqft.toFixed(0));
                                string += ("," + (typeof averages.rent === "undefined" ? "" : averages.rent.toFixed(0)));
                                string += ("," + (typeof averages.concessions === "undefined" ? "" : averages.concessions.toFixed(0)));
                                string += ("," + (typeof averages.ner === "undefined" ? "" : averages.ner.toFixed(0)));
                                string += ("," + (typeof averages.nersqft === "undefined" ? "" : averages.nersqft.toFixed(2)));
                                string += ",,,";
                                string += ",,,,,";
                                string += ("\r\n");
                            }

                            averages = averagesService.average(subjectData);
                            string += (csvEncode(prop.name));
                            string += (",Subject");
                            string += ("," + csvEncode(prop.name));
                            string += (",All");
                            string += ("," + moment(subjectStatic.date).utcOffset(-480).format("MM/DD/YYYY"));
                            string += ("," + averages.totUnits);
                            string += ("," + averages.sqft.toFixed(0));
                            string += ("," + (typeof averages.rent === "undefined" ? "" : averages.rent.toFixed(0)));
                            string += ("," + (typeof averages.concessions === "undefined" ? "" : averages.concessions.toFixed(0)));
                            string += ("," + (typeof averages.ner === "undefined" ? "" : averages.ner.toFixed(0)));
                            string += ("," + (typeof averages.nersqft === "undefined" ? "" : averages.nersqft.toFixed(2)));                            // string += ("," + Math.round(c.survey.occupancy * 100) / 100);
                            string += ("," + Math.round(subjectStatic.occupancy * 100) / 100);
                            string += ("," + subjectStatic.weeklytraffic);
                            string += ("," + subjectStatic.weeklyleases);
                            string += ("," + subjectStatic.address);
                            string += ("," + subjectStatic.city);
                            string += ("," + subjectStatic.state);
                            string += ("," + subjectStatic.zip);
                            string += ("," + subjectStatic.constructionType);
                            string += ("," + subjectStatic.yearBuilt);
                            string += ("\r\n");

                            averages = averagesService.average(compData);
                            compAverages = averagesService.averagePropertyLevel(compPropertyLevelData);

                            string += ("Comp Average,Subject");
                            string += ("," + csvEncode(prop.name));
                            string += (",All");
                            string += (",");
                            string += ("," + averages.totUnits);
                            string += ("," + averages.sqft.toFixed(0));
                            string += ("," + (typeof averages.rent === "undefined" ? "" : averages.rent.toFixed(0)));
                            string += ("," + (typeof averages.concessions === "undefined" ? "" : averages.concessions.toFixed(0)));
                            string += ("," + (typeof averages.ner === "undefined" ? "" : averages.ner.toFixed(0)));
                            string += ("," + (typeof averages.nersqft === "undefined" ? "" : averages.nersqft.toFixed(2)));
                            string += ("," + (typeof compAverages.occupancy === "undefined" ? "" : Math.round(compAverages.occupancy * 100) / 100));
                            string += ("," + (typeof compAverages.weeklytraffic === "undefined" ? "" : compAverages.weeklytraffic.toFixed(0)));
                            string += ("," + (typeof compAverages.weeklyleases === "undefined" ? "" : compAverages.weeklyleases.toFixed(0)));
                            string += ",,,,,,"
                            string += ("\r\n");
                        }

                        callbackp();
                    });
                }, function() {
                    callback(string);
                })

            })

        })

    }
}

var csvEncode = function(s) {
    var result = s.replace(/"/g, '""');
    if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
    return result;
}