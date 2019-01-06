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
    getCsvGroupedAsync: function(operator, subdomain, endDate) {
        var _this = this;
        return new Promise((resolve, reject) => {
            _this.getCsvGrouped(operator, subdomain, endDate, function(data) {
                resolve(data);
            });
        });
    },
    getCsvGrouped: function(operator, subdomain, endDate, callback) {
        let string = "Property,Subject/Comp,CompFor,UnitType,Units,Sqft,Market Rent,Total Concessions,Net Eff. Rent,NER/Sqft,Occupancy %,Leased %,Traffic,Leases,Address,City,State,ZipCode,Construction,Year Built\r\n";

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
                                            totUnits: c.survey.totUnits,
                                            occupancy: c.survey.occupancy,
                                            leased: c.survey.leased,
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
                                            subjectStatic.occupancy = c.survey.occupancy;
                                            subjectStatic.leased = c.survey.leased;
                                            subjectStatic.weeklytraffic = c.survey.weeklytraffic;
                                            subjectStatic.weeklyleases = c.survey.weeklyleases;
                                            subjectStatic.address = c.address;
                                            subjectStatic.city = c.city;
                                            subjectStatic.state = c.state;
                                            subjectStatic.zip = c.zip;
                                            subjectStatic.constructionType = c.constructionType;
                                            subjectStatic.yearBuilt = c.yearBuilt;

                                            string += getString({
                                                property: prop.name,
                                                subjectorcomp: "Subject",
                                                subject: prop.name,
                                                bedrooms: b + " Bdrs",
                                                totUnits: t.totUnits,
                                                sqft: t.sqft,
                                                rent: t.rent,
                                                concessions: t.concessions,
                                                ner: t.ner,
                                                nersqft: t.nersqft,
                                                occupancy: undefined,
                                                leased: undefined,
                                                weeklytraffic: undefined,
                                                weeklyleases: undefined,
                                                address: "",
                                                city: "",
                                                state: "",
                                                zip: "",
                                                constructionType: "",
                                                yearBuilt: "",
                                            });
                                        }
                                    }
                                }
                            });
                            let averages;
                            let compAverages;

                            averages = averagesService.average(subjectData);
                            string += getString({
                                property: prop.name,
                                subjectorcomp: "Subject",
                                subject: prop.name,
                                bedrooms: "All",
                                totUnits: averages.totUnits,
                                sqft: averages.sqft,
                                rent: averages.rent,
                                concessions: averages.concessions,
                                ner: averages.ner,
                                nersqft: averages.nersqft,
                                occupancy: subjectStatic.occupancy,
                                leased: subjectStatic.leased,
                                weeklytraffic: subjectStatic.weeklytraffic,
                                weeklyleases: subjectStatic.weeklyleases,
                                address: subjectStatic.address,
                                city: subjectStatic.city,
                                state: subjectStatic.state,
                                zip: subjectStatic.zip,
                                constructionType: subjectStatic.constructionType,
                                yearBuilt: subjectStatic.yearBuilt,
                            });

                            for (let b in bedrooms) {
                                averages = averagesService.average(bedrooms[b]);

                                string += getString({
                                    property: "Comp Average",
                                    subjectorcomp: "Comp",
                                    subject: prop.name,
                                    bedrooms: b + " Bdrs",
                                    totUnits: averages.totUnits,
                                    sqft: averages.sqft,
                                    rent: averages.rent,
                                    concessions: averages.concessions,
                                    ner: averages.ner,
                                    nersqft: averages.nersqft,
                                    occupancy: undefined,
                                    leased: undefined,
                                    weeklytraffic: undefined,
                                    weeklyleases: undefined,
                                    address: "",
                                    city: "",
                                    state: "",
                                    zip: "",
                                    constructionType: "",
                                    yearBuilt: "",
                                });
                            }

                            averages = averagesService.average(compData);
                            compAverages = averagesService.averagePropertyLevel(compPropertyLevelData);

                            string += getString({
                                property: "Comp Average",
                                subjectorcomp: "Comp",
                                subject: prop.name,
                                bedrooms: "All",
                                totUnits: averages.totUnits,
                                sqft: averages.sqft,
                                rent: averages.rent,
                                concessions: averages.concessions,
                                ner: averages.ner,
                                nersqft: averages.nersqft,
                                occupancy: compAverages.occupancy,
                                leased: compAverages.leased,
                                weeklytraffic: compAverages.weeklytraffic,
                                weeklyleases: compAverages.weeklyleases,
                                address: "",
                                city: "",
                                state: "",
                                zip: "",
                                constructionType: "",
                                yearBuilt: "",
                            });
                        }

                        callbackp();
                    });
                }, function() {
                    callback(string);
                });
            });
        });
    },
}

var csvEncode = function(s) {
    var result = s.replace(/"/g, '""');
    if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
    return result;
}

function getString(values) {
    let string = "";
    string += csvEncode(values.property);
    string += "," + csvEncode(values.subjectorcomp);
    string += "," + values.subject;
    string += "," + values.bedrooms;
    string += "," + values.totUnits;
    string += "," + values.sqft.toFixed(0);
    string += "," + (typeof values.rent === "undefined" ? "" : values.rent.toFixed(0));
    string += "," + (typeof values.concessions === "undefined" ? "" : values.concessions.toFixed(0));
    string += "," + (typeof values.ner === "undefined" ? "" : values.ner.toFixed(0));
    string += "," + (typeof values.nersqft === "undefined" ? "" : values.nersqft.toFixed(2));
    string += "," + (typeof values.occupancy === "undefined" || values.occupancy === null ? "" : Math.round(values.occupancy * 100) / 100);
    string += "," + (typeof values.leased === "undefined" || values.leased === null ? "" : Math.round(values.leased * 100) / 100);
    string += "," + (typeof values.weeklytraffic === "undefined" || values.weeklytraffic === null ? "" : values.weeklytraffic.toFixed(0));
    string += "," + (typeof values.weeklyleases === "undefined" || values.weeklyleases === null ? "" : values.weeklyleases.toFixed(0));
    string += "," + values.address;
    string += "," + values.city;
    string += "," + values.state;
    string += "," + values.zip;
    string += "," + values.constructionType;
    string += "," + values.yearBuilt;
    string += "\r\n";

    return string;
}