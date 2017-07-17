var PropertyService = require('../../properties/services/propertyService')
var organizationService = require('../../organizations/services/organizationService')
var queueService = require('./queueService');
var _ = require("lodash")
var async = require("async");
var moment = require('moment')
module.exports = {
    getCsv: function (operator, subdomain, endDate, callback) {
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
                                skipPoints : true,
                                surveyDateStart: endDate == null ? null : '1970-1-1',
                                surveyDateEnd: endDate,
                                daterange: {}
                            }
                        }, function (err, dashboard) {
                            var b, t;
                            if (prop.totalUnits && prop.totalUnits > 0 && dashboard.comps.length > 1) {
                                dashboard.comps.forEach(function (c, i) {
                                    if(c.survey.date) {
                                        for (b in c.survey.bedrooms) {
                                            t = c.survey.bedrooms[b];
                                            string += (CSVEncode(c.name));
                                            string += (',' + (i == 0 ? 'Subject' : 'Comp'));
                                            string += (',' + CSVEncode(prop.name))
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
        
    }
}

var CSVEncode = function(s) {
    var result = s.replace(/"/g, '""');
    if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
    return result;
}