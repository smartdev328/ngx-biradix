"use strict";
const PropertySchema= require("../schemas/propertySchema");
const SurveySchema= require("../schemas/surveySchema");
const _ = require("lodash");
const CompsService = require("./compsService");
const userService = require("../../users/services/userService");
const EmailService = require("../../business/services/emailService");
const AuditService = require("../../audit/services/auditService");

module.exports = {
    emailGuest: function(operator, context, base, propertyid, guestid, callback) {
        PropertySchema.find({_id: propertyid}, function(err, properties) {
            if (!properties || properties.length != 1) {
                return callback([{msg: "Unable to locate Property. Please contact the Administrator"}]);
            }
            let property = properties[0];

            // Get user / Check that primarySubject exists
            userService.getUserById(guestid, function(err, guest) {
                if (!guest) {
                    return callback([{msg: "Unable to locate Contact. Please contact the Administrator"}]);
                }

                if (!guest.guestStats) {
                    return callback([{msg: "This Contact is not properly configured. Please re-add this Contact or contact the Administrator"}]);
                }

                let guestStatComp = _.find(guest.guestStats, function(x) {
                    return x.propertyid == propertyid;
                });

                if (!guestStatComp) {
                    return callback([{msg: "This Contact is not properly configured. Please re-add this Contact or contact the Administrator"}]);
                }

                // Get subjects, exclude yourself
                CompsService.getSubjects([propertyid], {select: "_id name"}, function(err, subjects) {
                    _.remove(subjects, function(x) {
                        return x._id.toString() == propertyid;
                    });

                    let SubjectNames = _.map(subjects, function(x) {
                        return x.name;
                    });

                    // SubjectNames = _.take(SubjectNames,1);
                    // Create Login Token that expires in 30 days.
                    guest.minutesToExpire = 60 * 24 * 30;
                    userService.getFullUser(guest, function(full) {
                        // Send Email
                        let email = {
                            to: guest.email,
                            bcc: "surveyswapemails@biradix.com",
                            logo: base + "/images/organizations/biradix.png",
                            subject: operator.first + " " + operator.last + " is asking for some information about " + property.name,
                            template: "swap.html",
                            templateData: {
                                first: guest.first,
                                comp: property.name,
                                subjects: SubjectNames,
                                link: base + "/g/" + property._id.toString() + "/" + full.token,
                                operator: operator.first + " " + operator.last,
                            },
                        };

                        // email.to = 'alex@biradix.com';
                        // email.bcc = '';

                        EmailService.send(email, function(emailError, status) {
                            console.log(status);

                            if (emailError || !status || !status.message || status.message != "success") {
                                return callback([{msg: "Unable to deliver mesage to Contact. Please contact the Administrator"}]);
                            }
                            // Activity History
                            let data = [{description: "Subjects: " + SubjectNames.join(", ")}];

                            AuditService.create({operator: operator, property: property, user: guest, type: "survey_emailed", description: `Property: ${property.name}, User: ${guest.first} ${guest.last}`, data: data});

                            // Update Last Emailed
                            userService.updateGuestStatsLastEmailed(guestid, propertyid, {first: operator.first, last: operator.last, email: operator.email, logo: operator.orgs[0].logoBig}, function() {
                                callback(null);
                            });
                        });
                    });
                });
            });
        });
    },
    getSurveyBeforeDate: function(propertyid, dateStart,dateEnd, callback) {
        // console.log({propertyid: propertyid,date:{$gt:dateStart, $lte:dateEnd}});
        SurveySchema.find({propertyid: propertyid,date:{$gt:new Date(dateStart), $lte:new Date(dateEnd)}}).sort('-date').limit(1).exec(callback);

    },
    getAllSurveys: function(propertyid,callback) {
        SurveySchema.find({propertyid: propertyid}).sort('date').exec(callback);

    },
    updateLastSurvey: function(propertyid, callback) {
        SurveySchema.find({propertyid: propertyid, doneByOwner: true}).sort('-date').limit(1).exec(function (err, ownersurveys) {
            var dateByOwner = null;

            if (ownersurveys && ownersurveys.length && ownersurveys.length == 1) {
                dateByOwner = ownersurveys[0].date;
            }

            SurveySchema.find({propertyid: propertyid}).sort('-date').limit(1).exec(function (err, surveys) {
                if (err) {
                    return callback();
                }

                if (!surveys || surveys.length == 0) {
                    var query = {_id: propertyid};
                    var update = {survey: {}};
                    var options = {new: true};

                    PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                        callback()
                    })
                }
                else {
                    var survey = surveys[0];

                    var totUnits = _.sum(survey.floorplans, function (fp) {
                        return fp.units
                    });

                    if (totUnits > 0) {
                        var ner = Math.round(_.sum(survey.floorplans, function (fp) {
                                return (fp.rent - fp.concessions / 12) * fp.units
                            }) / totUnits);

                        var s = {
                            id: survey._id,
                            occupancy: survey.occupancy,
                            leased: survey.leased,
                            renewal: survey.renewal,
                            atr: survey.atr,
                            atr_percent: survey.atr_percent,
                            ner: ner,
                            weeklyleases: survey.weeklyleases,
                            weeklytraffic: survey.weeklytraffic,
                            notes: survey.notes,
                            date: survey.date,
                            dateByOwner : dateByOwner
                        }

                        var query = {_id: propertyid};
                        var update = {survey: s, $unset: {needsSurvey: ""}};
                        var options = {new: true};

                        PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                            callback()
                        })
                    }
                    else {
                        var query = {_id: propertyid};
                        var update = {survey: undefined};
                        var options = {new: true};

                        PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                            callback()
                        })
                    }
                }

            })
        })
    },

    getSubjectExclusions: function (compid, compFloorplans, callback) {
        CompsService.getSubjects(compid, {select: "_id name comps"}, function (err, obj) {
            var exclusions = [];

            obj.forEach(function (p) {
                var comp = _.find(p.comps, function (c) {
                    return c.id.toString() == compid
                })
                if (comp.excluded) {
                    exclusions.push({subjectid: p._id, floorplans: _.difference(compFloorplans, comp.floorplans)});
                }
            })

            callback(exclusions);
        });
    },
    floorplansToSurvey : function(survey, floorplans, links, hide, nerPlaces) {
        getSurveyStats(floorplans, survey, links, hide, nerPlaces);
        survey.bedrooms = {};
        var temp;
        for (var i = 0; i < 7; i++) {
            temp = _.filter(floorplans, function (x) {
                return x.bedrooms == i
            });

            if (temp.length > 0) {
                survey.bedrooms[i] = {};
                getSurveyStats(temp, survey.bedrooms[i], links, hide,nerPlaces);
            }
        }

        survey.floorplans = floorplans;

        survey.floorplans.forEach(function (fp) {
            delete fp.amenities;
            fp.ner = Math.round(fp.rent - (fp.concessions / 12))
            fp.nersqft = Math.round(fp.ner / fp.sqft * 100) / 100
            fp.mersqft = Math.round(fp.rent / fp.sqft * 100) / 100

            fp.runrate = Math.round((fp.rent - (fp.concessionsMonthly || 0)) * 100) / 100;
            fp.runratesqft = Math.round((fp.rent - (fp.concessionsMonthly || 0)) / fp.sqft * 100) / 100

            if (links.excluded === true && hide) {
                links.floorplans = links.floorplans.map(function (x) {
                    return x.toString()
                })

                //console.log(links.floorplans, fp.id)
                if (links.floorplans.indexOf(fp.id.toString()) == -1) {
                    fp.excluded = true;
                    delete fp.rent;
                    delete fp.concessions;
                    delete fp.ner;
                    delete fp.nersqft;
                    delete fp.mersqft;
                    delete fp.runrate;
                    delete fp.runratesqft;
                }
            }
        })
    }
}


var  getSurveyStats = function(floorplans, survey, links, hide, nerPlaces) {

    var fps = _.cloneDeep(floorplans);

    var fpids = _.pluck(floorplans, "id").map(function (x) {
        return x.toString()
    })

    var totUnits = _.sum(fps, function (fp) {
        return fp.units
    });
    survey.totUnits = totUnits;

    if (links.excluded === true && hide) {
        links.floorplans = links.floorplans.map(function (x) {
            return x.toString()
        })

        fps = _.filter(fps, function (x) {
            return links.floorplans.indexOf(x.id.toString()) > -1
        })

        var excluded = _.find(fpids, function (x) {
            return links.floorplans.indexOf(x.toString()) == -1
        })

        if (excluded) {
            survey.excluded = true;
        }
    }

    totUnits = _.sum(fps, function (fp) {
        if (!fp.rent && fp.rent !== 0) {
            return 0;
        }
        return fp.units;
    });

    if (totUnits > 0) {
        survey.sqft = _.sum(fps, function (fp) {
                return (fp.sqft) * fp.units
            }) / totUnits;
        survey.rent = _.sum(fps, function (fp) {
                return (fp.rent) * fp.units
            }) / totUnits
        survey.concessions = _.sum(fps, function (fp) {
                return (fp.concessions) * fp.units
            }) / totUnits;

        survey.runrate = _.sum(fps, function (fp) {
                return (fp.rent - (fp.concessionsMonthly || 0)) * fp.units
            }) / totUnits


        survey.ner = survey.rent - (survey.concessions / 12)
        survey.nersqft = Math.round(survey.ner / survey.sqft * 100) / 100
        survey.mersqft = Math.round(survey.rent / survey.sqft * 100) / 100
        survey.runratesqft = Math.round(survey.runrate / survey.sqft * 100) / 100


        if (!nerPlaces) {
            survey.ner = Math.round(survey.ner);
            survey.rent = Math.round(survey.rent);
            survey.runrate = Math.round(survey.runrate);
        }        
        survey.sqft = Math.round(survey.sqft);
        survey.concessions = Math.round(survey.concessions);
    }
}