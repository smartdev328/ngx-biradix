'use strict';
var PropertySchema= require('../schemas/propertySchema')
var SurveySchema= require('../schemas/surveySchema')
//////////////////////////
var AccessService = require('../../access/services/accessService')
var OrgService = require('../../organizations/services/organizationService')
var AmenityService = require('../../amenities/services/amenityService')
var AuditService = require('../../audit/services/auditService')
///////////////////////////
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
///////////////////////////
var CompsService = require('./compsService')
var PropertyHelperService = require('./propertyHelperService')
var SurveyHelperService = require('./surveyHelperService')


module.exports = {
    linkComp:function(operator,context,revertedFromId,subjectid, compid, callback) {
        CompsService.linkComp(operator,context,revertedFromId, true, subjectid,compid,callback);
    },
    saveCompLink:function(operator,context,revertedFromId,subjectid, compid, floorplans, callback) {
        var ObjectId = require('mongoose').Types.ObjectId;
        var query = {_id: new ObjectId(subjectid), 'comps.id': new ObjectId(compid)};


        PropertySchema.findOne({_id: compid}, function(err,comp) {
            if (!comp) {
                return callback([{msg: 'Unable to find property'}])
            }
            PropertySchema.findOne({_id: subjectid}, function (err, subj) {
                if (!subj) {
                    return callback([{msg: 'Unable to find property'}])
                }

                var isLinked = _.find(subj.comps, function (x) {
                    return x.id.toString() == compid.toString()
                })

                if (!isLinked) {
                    return callback([{msg: 'Unable to update comp links, not currently linked.'}])
                }

                var old = isLinked.floorplans.map(function(x) {return x.toString()})

                var updated = floorplans.map(function(x) {return x.toString()})
                var full = _.pluck(comp.floorplans,"id").map(function(x) {return x.toString()})

                var excluded = !_.isEqual(full.sort(), updated.sort())

                var update = {$set: {'comps.$.floorplans': floorplans, 'comps.$.excluded': excluded}};

                if (_.isEqual(old.sort(), updated.sort())) {
                    return callback([{msg: 'Unable to update comp links, no changes detected'}])
                }

                var removed = _.difference(old, updated);
                var added = _.difference(updated, old);

                var addedData = [];
                var removedData = [];

                if (added && added.length > 0) {
                    _.filter(comp.floorplans, function(x) {return added.indexOf(x.id.toString()) > -1}).forEach(function(fp) {
                        addedData.push({type:'added', id: fp.id.toString(), description: 'Added: ' + PropertyHelperService.floorplanName(fp)})
                    })
                }

                if (removed && removed.length > 0) {
                    _.filter(comp.floorplans, function(x) {return removed.indexOf(x.id.toString()) > -1}).forEach(function(fp) {
                        removedData.push({type:'removed', id: fp.id.toString(), description: 'Removed: ' + PropertyHelperService.floorplanName(fp)})
                    })
                }

                PropertySchema.update(query, update, function (err, saved) {

                    AuditService.create({
                        operator: operator,
                        property: subj,
                        type: 'links_updated',
                        revertedFromId: revertedFromId,
                        description: subj.name + " + " + comp.name + " (" + added.length + " Added, " + removed.length +" Removed)",
                        context: context,
                        data: [{
                            description: "Subject: " + subj.name,
                            id: subj._id
                        }, {description: "Comp: " + comp.name, id: comp._id},].concat(addedData).concat(removedData)
                    })


                    return callback(err, saved)
                })
            })
        })
    },
    unlinkComp:function(operator,context,revertedFromId,subjectid, compid, callback) {
        var ObjectId = require('mongoose').Types.ObjectId;
        var query = {_id: new ObjectId(subjectid)};
        var update = {$pull: {comps : {id : ObjectId(compid)}}};

        PropertySchema.findOne({_id: compid}, function(err,comp) {
            if (!comp) {
                return callback([{msg: 'Unable to find property'}])
            }
            PropertySchema.findOne({_id: subjectid}, function (err, subj) {
                if (!subj) {
                    return callback([{msg: 'Unable to find property'}])
                }

                var isLinked = _.find(subj.comps, function (x) {
                    return x.id == compid
                })

                if (!isLinked) {
                    return callback([{msg: 'Unable to unlink comp, it is not currently linked.'}])
                }
                PropertySchema.update(query, update, function (err, saved) {
                    AuditService.create({
                        operator: operator,
                        property: subj,
                        type: 'comp_unlinked',
                        revertedFromId: revertedFromId,
                        description: subj.name + " ~ " + comp.name,
                        context: context,
                        data: [{
                            description: "Subject: " + subj.name,
                            id: subj._id
                        }, {description: "Comp: " + comp.name, id: comp._id},]
                    })
                    return callback(err, saved)
                })
            })
        })
    },
    getSurvey: function(criteria, callback) {
        if (!criteria.ids || criteria.ids.length == 0) {
            return callback('Error', null);
        }
        var query = SurveySchema.find();
        query = query.where('_id').in(criteria.ids);

        if (criteria.select) {
            query = query.select(criteria.select);
        }

        query.exec(function(err, surveys) {
            surveys = JSON.parse(JSON.stringify(surveys))
            surveys.forEach(function(s,i) {
                if (!criteria.select || criteria.select.indexOf('propertyid') == -1) {
                    delete surveys[i].propertyid;
                }
                delete surveys[i].location_amenities;
                delete surveys[i].community_amenities;
                delete surveys[i].exclusions;
                surveys[i].floorplans.forEach(function(fp,j) {
                    delete surveys[i].floorplans[j].amenities;
                })
            })
            callback(err,surveys)
        })
    },
    search: function(Operator, criteria, callback) {
        criteria.permission = criteria.permission || 'PropertyView';

        criteria.search = (criteria.search || '').trim();

        async.parallel({
            permissions: function(callbackp) {
                if (Operator.memberships.isadmin === true) {
                    callbackp(null,[]);
                } else {
                    AccessService.getPermissions(Operator, [criteria.permission], function(permissions) {
                        callbackp(null, permissions)
                    });
                }
            },
            orgs: function(callbackp) {
                OrgService.read(function (err, orgs) {
                    callbackp(null, orgs)
                });
            },

            amenities: function(callbackp) {
                var time = new Date();
                AmenityService.search({active: true},function(err, amenities) {
                    var time2 = new Date();
                    //console.log("Amenities: " + (time2.getTime() - time.getTime()));
                    callbackp(err, amenities)
                })
        }
        }, function(err, all) {
            var query = PropertySchema.find();
            if (criteria._id) {
                criteria.ids = criteria.ids || [];
                criteria.ids.push(criteria._id);
            }

            if (Operator.memberships.isadmin === true) {
                if (criteria.ids) {
                    query = query.where("_id").in(criteria.ids);
                }

                if (criteria.exclude) {
                    query = query.where("_id").nin(criteria.exclude);
                }
            }
            else {

                if (criteria.ids) {
                    all.permissions = _.intersection(all.permissions, criteria.ids);
                }

                if (criteria.exclude) {
                    _.remove(all.permissions, function(p) {return criteria.exclude.indexOf(p) > -1})
                }

                query = query.where('_id').in(all.permissions);
            }



            if (criteria.active != null) {
                query = query.where("active").equals(criteria.active);
            }
            query = query.sort(criteria.sort || "name");

            if (criteria.search != '') {
                var s = new RegExp(criteria.search, "i")
                query = query.or([{'name' : s}, {'address' : s}, {'city' : s}, {'state' : s}]);
                query = query.select(criteria.select || '_id name address city state zip');
            } else {
                query = query.select(criteria.select || '_id name');
            }

            query.exec(function(err, props) {
                var time = new Date();
                if (props && props.length > 0) {

                    props = JSON.parse(JSON.stringify(props))
                    if (criteria.search != '') {
                        var isBr = criteria.search.toLowerCase() == "b" || criteria.search.toLowerCase() == "br";
                        var isI = criteria.search.toLowerCase() == "i";
                        //calculate summary for autocomplete
                        props.forEach(function(x,i) {
                                if (isBr) {
                                    props[i].summary = x.name + "<p><i>" + x.address + ", " + x.city + ", " + x.state + "</i></p>";
                                } else if (isI) {
                                    props[i].summary = x.name + "<br><em>" + x.address + ", " + x.city + ", " + x.state + "</em>";

                                } else {
                                    props[i].summary = x.name + "<br><i>" + x.address + ", " + x.city + ", " + x.state + "</i>";
                                }

                            }
                        )

                        //sort by first occurance
                        props = _.sortBy(props, function(x) {
                            return x.summary.toLowerCase().indexOf(criteria.search.toLowerCase());
                        });
                    }

                    props = _.take(props, criteria.limit || 10)
                }

                var lookups = {fees: {}, amenities: []};

                if (props && props.length > 0) {
                    if (criteria.select && criteria.select.indexOf('fees') > -1) {
                        lookups.fees = PropertyHelperService.fees;
                    }
                    props.forEach(function(x) {

                        if (x.orgid) {
                            x.company = '';
                            var company = _.find(all.orgs, function (o) {
                                return o._id.toString() == x.orgid.toString()
                            })
                            if (company) {
                                x.company = company.name;
                            }

                        }

                        if (x.community_amenities) {
                            x.community_amenities.forEach(function(x) {
                                var am = _.find(all.amenities, function(a) {return a._id.toString() == x.toString()})
                                if (am) {
                                    lookups.amenities.push({_id: am._id, name: am.name})
                                }
                            })
                        }

                        if (x.location_amenities) {
                            x.location_amenities.forEach(function(x) {
                                var am = _.find(all.amenities, function(a) {return a._id.toString() == x.toString()})
                                if (am) {
                                    lookups.amenities.push({_id: am._id, name: am.name})
                                }
                            })
                        }

                        if (x.floorplans) {
                            x.floorplans.forEach(function(fp) {
                                fp.amenities.forEach(function(x) {
                                    var am = _.find(all.amenities, function(a) {return a._id.toString() == x.toString()})
                                    if (am) {
                                        if (!_.find(lookups.amenities, function(l) {return l._id.toString() == am._id.toString()})) {
                                            lookups.amenities.push({_id: am._id, name: am.name})
                                        }
                                    }
                                })
                            })
                        }

                    })
                }

                var time2 = new Date();
                //console.log("After DB: " + (time2.getTime() - time.getTime()));

                callback(err,props, lookups)
            })
        })
    },
    updateActive : function(operator, property, context, revertedFromId, callback)  {
        var modelErrors = [];

        if (!property.id)
        {
            modelErrors.push({msg : 'Invalid property id.'});
        }

        if (property.active === null)
        {
            modelErrors.push({param: 'active', msg : 'Missing active status.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }
        var query = {_id: property.id};
        var update = {active: property.active};
        var options = {new: true};

        PropertySchema.findOne(query, function(err, old) {
            if (old.active === property.active) {
                modelErrors.push({msg: 'Property is already ' + (old.active ? 'Active' : 'Inactive')});
                callback(modelErrors, null);
                return;
            }
            PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {

                if (err) {
                    modelErrors.push({msg: 'Unable to update property.'});
                    callback(modelErrors, null);
                    return;
                }

                AuditService.create({operator: operator, property: saved, type: 'property_status', revertedFromId : revertedFromId, description: saved.name + ': ' + (property.active ? "Inactive => Active" : "Active => Inactive"), context: context, data : [{description: "Previous: " + (property.active ? "Inactive" : "Active"), status: !property.active}]})

                return callback(err, saved)
            })
        });

    },
    deleteSurvey: function(operator,context,revertedFromId, id, callback) {
        async.waterfall([
            function(callbackw){
                SurveySchema.findOne({_id:id}, function(err, survey) {

                    if (!survey) {
                        callbackw([{msg:'Unable to find survey to delete'}])
                    } else {
                        callbackw(null,survey)
                    }

                })

            },
            function(survey, callbackw) {
                PropertySchema.findOne({_id:survey.propertyid}, function(err, prop) {
                    callbackw(null,survey,prop)
                })
            }
        ], function(err,survey, prop ) {

            if (err) {
                return callback(err);
            }

            var data = [{description: "Date: " + moment(survey.date).format("MM/DD/YYYY"), survey: survey}];

            SurveySchema.findByIdAndRemove(survey._id, function(err) {

                if (err) {
                    return callback([{msg:err}]);
                }

                SurveyHelperService.updateLastSurvey(prop._id, function() {
                    callback(null)
                })

                AuditService.create({
                    operator: operator,
                    property: prop,
                    type: 'survey_deleted',
                    revertedFromId: revertedFromId,
                    description: prop.name + ": " + moment(survey.date).format("MM/DD/YYYY"),
                    context: context,
                    data: data
                })

            })




        });

    },
    updateSurvey: function(operator,context,revertedFromId, id, surveyid, survey, callback) {

        var compFloorplans = _.pluck(survey.floorplans,"id");

        var property;

        PropertySchema.findOne({_id:id}, function(err, subject) {
            property = subject;
            SurveySchema.findOne({_id: surveyid}, function (err, lastsurvey) {

                 var copy = {};
                copy.propertyid = lastsurvey.propertyid;
                copy._id = lastsurvey._id;
                copy.floorplans = lastsurvey.floorplans;
                copy.occupancy = lastsurvey.occupancy;
                copy.weeklyleases = lastsurvey.weeklyleases;
                copy.weeklytraffic = lastsurvey.weeklytraffic;


                var data = [{description: "Date: " + moment(lastsurvey.date).format("MM/DD/YYYY"), survey: copy}];


                if (lastsurvey.occupancy !== survey.occupancy) {
                    data.push({description: "Occupancy: " + lastsurvey.occupancy + "% => " + survey.occupancy + "%"})
                }

                if (lastsurvey.weeklyleases !== survey.weeklyleases) {
                    data.push({description: "Leases/Week: " + lastsurvey.weeklyleases + " => " + survey.weeklyleases })
                }

                if (lastsurvey.weeklytraffic !== survey.weeklytraffic) {
                    data.push({description: "Traffic/Week: " + lastsurvey.weeklytraffic + " => " + survey.weeklytraffic })
                }

                survey.floorplans.forEach(function(fp) {
                    var oldfp = _.find(lastsurvey.floorplans, function(x) {return x.id == fp.id});

                    if (!oldfp) {
                        data.push({description: PropertyHelperService.floorplanName(fp) + ": " + PropertyHelperService.floorplanRentName(fp) })
                    }
                    else if (oldfp.rent !== fp.rent || oldfp.concessions !== fp.concessions) {
                        data.push({description: PropertyHelperService.floorplanName(oldfp) + ": " + PropertyHelperService.floorplanRentName(oldfp) + " => " + PropertyHelperService.floorplanRentName(fp) })
                    }
                })

                lastsurvey.floorplans = survey.floorplans;
                lastsurvey.occupancy = survey.occupancy;
                lastsurvey.weeklyleases = survey.weeklyleases;
                lastsurvey.weeklytraffic = survey.weeklytraffic;

                lastsurvey.save(function (err, created) {

                    SurveyHelperService.updateLastSurvey(property._id, function() {
                        callback(err, created)
                    })

                    AuditService.create({
                        operator: operator,
                        property: property,
                        type: 'survey_updated',
                        revertedFromId: revertedFromId,
                        description: property.name + ": " + (data.length -1) + " update(s)",
                        context: context,
                        data: data
                    })
                });
            });
        });
    },
    createSurvey: function(operator,context,revertedFromId, id, survey, callback) {

        var compFloorplans = _.pluck(survey.floorplans,"id");

        var subject;

        async.waterfall([
            function(callbackw){
                PropertySchema.findOne({_id:id}, function(err, prop) {
                    subject = prop;
                    callbackw(null,prop.survey.id)
                })
            },
            function(surveyid, callbackw) {
                if (surveyid) {
                    SurveySchema.findOne({_id:surveyid}, function(err, lastsurvey) {
                        callbackw(null,lastsurvey)
                    })
                } else {
                    callbackw(null,{})
                }
            },
            function(lastsurvey, callbackw) {
                SurveyHelperService.getSubjectExclusions(id, compFloorplans, function(exclusions) {
                    callbackw(null,lastsurvey,exclusions)
                })
            }
        ], function(err,lastsurvey, exclusions ) {

            if (!lastsurvey) {
                lastsurvey = {}
            }

            lastsurvey.occupancy = lastsurvey.occupancy || '-';
            lastsurvey.weeklyleases = lastsurvey.weeklyleases || '-';
            lastsurvey.weeklytraffic = lastsurvey.weeklytraffic || '-';
            lastsurvey.floorplans = lastsurvey.floorplans || [];

            var n = new SurveySchema();

            if (survey._id) {
                n._id = survey._id
            }
            n.floorplans = survey.floorplans;
            n.location_amenities = survey.location_amenities || [];
            n.community_amenities = survey.community_amenities || [];
            n.propertyid = id;
            n.occupancy = survey.occupancy;
            n.weeklyleases = survey.weeklyleases;
            n.weeklytraffic = survey.weeklytraffic;
            n.date = survey.date || Date.now();
            n.exclusions = exclusions;

            var data = [{description: "Date: " + moment(n.date).format("MM/DD/YYYY"), id: n._id}];

            if (lastsurvey.occupancy !== n.occupancy) {
                data.push({description: "Occupancy: " + lastsurvey.occupancy + "% => " + n.occupancy + "%"})
            }

            if (lastsurvey.weeklyleases !== n.weeklyleases) {
                data.push({description: "Leases/Week: " + lastsurvey.weeklyleases + " => " + n.weeklyleases })
            }

            if (lastsurvey.weeklytraffic !== n.weeklytraffic) {
                data.push({description: "Traffic/Week: " + lastsurvey.weeklytraffic + " => " + n.weeklytraffic })
            }

            n.floorplans.forEach(function(fp) {
                var oldfp = _.find(lastsurvey.floorplans, function(x) {return x.id == fp.id});

                if (!oldfp) {
                    data.push({description: PropertyHelperService.floorplanName(fp) + ": " + PropertyHelperService.floorplanRentName(fp) })
                }
                else if (oldfp.rent !== fp.rent || oldfp.concessions !== fp.concessions) {
                    data.push({description: PropertyHelperService.floorplanName(oldfp) + ": " + PropertyHelperService.floorplanRentName(oldfp) + " => " + PropertyHelperService.floorplanRentName(fp) })
                }
            })

            n.save(function (err, created) {
                data[0].id=created._id;

                SurveyHelperService.updateLastSurvey(subject._id, function() {
                    callback(err, created)
                })

                AuditService.create({
                    operator: operator,
                    property: subject,
                    type: 'survey_created',
                    revertedFromId: revertedFromId,
                    description: subject.name + ": " + (data.length -1) + " update(s)",
                    context: context,
                    data: data
                })
            });
        });



    },
    getLastSurveyStats: function(hide,subject, comps, callback) {
        //console.log(subject.comps, comps);
        var surveyids = _.pluck(comps,"survey.id");
        if (!surveyids || surveyids.length == 0) {
            return callback();
        }

        SurveySchema.find().where("_id").in(surveyids).exec(function(err, surveys) {
            comps.forEach(function(comp) {
                if (comp.survey) {
                    var links = _.find(subject.comps, function(x) {return x.id == comp._id})

                    var s = _.find(surveys, function (x) {
                        return x._id == comp.survey.id
                    });

                    if (s) {
                        delete comp.survey.id;
                        comp.survey.date = s.date;
                        var daysSince = (Date.now() - s.date.getTime()) / 1000 / 60 / 60 / 24;
                        if (daysSince >= 15) {
                            comp.survey.tier = "danger";
                        } else if (daysSince >= 8) {
                            comp.survey.tier = "warning";
                        }

                        comp.survey.days = daysSince;

                        SurveyHelperService.getSurveyStats(s.floorplans, comp.survey, links, hide);

                        comp.survey.bedrooms = {};

                        for (var i = 0; i < 7; i++) {
                            var temp = _.filter(s.floorplans, function (x) {
                                return x.bedrooms == i
                            });

                            if (temp.length > 0) {
                                comp.survey.bedrooms[i] = {};
                                SurveyHelperService.getSurveyStats(temp, comp.survey.bedrooms[i], links, hide);
                            }
                        }

                        comp.survey.floorplans = s.floorplans;

                        comp.survey.floorplans.forEach(function (fp) {
                            delete fp.amenities;
                            fp.ner = Math.round(fp.rent - (fp.concessions / 12))
                            fp.nersqft = Math.round(fp.ner / fp.sqft * 100) / 100
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
                                }
                            }
                        })
                    }


                }
            });
            return callback();
        })
    }
}