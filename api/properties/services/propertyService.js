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
    getCompsForReminders: function(compids,callback) {
        var query = PropertySchema.find(
            {_id: {$in : compids}}
        );
        query.select("name orgid survey.id survey.occupancy survey.ner date totalUnits")
        query.exec(function(err, properties) {
            var surveyids = _.map(properties,function(x) {return x.survey ? x.survey.id.toString() : ""});

            _.remove(surveyids,function(x) {return x == ''})

            query = SurveySchema.find({_id: {$in : surveyids}});
            query.select("date");

            query.exec(function(err, surveys) {
                var final = [];
                properties.forEach(function(p) {
                    p.comps = _.map(p.comps,"id")
                    if (!p.survey) {
                        final.push({_id: p._id, name: p.name, totalUnits: p.totalUnits});
                    } else {
                        var survey = _.find(surveys, function (x) {
                            return x._id.toString() == p.survey.id.toString();
                        });

                        if (!survey) {
                            final.push({_id: p._id, name: p.name, totalUnits: p.totalUnits});
                        } else {
                            final.push({
                                _id: p._id,
                                name: p.name,
                                date: survey.date,
                                occupancy: p.survey.occupancy,
                                ner : p.survey.ner,
                                totalUnits: p.totalUnits
                            });
                        }

                    }
                })
                callback(final);
            });


        });



    },
    getPropertiesForReminders: function(callback) {
        var query = PropertySchema.find(
            {active: true, orgid: {$exists : true}, date : {$lte : moment().subtract(9,"day").format()}}
        );
        query.select("name orgid survey.id survey.occupancy survey.ner date comps.id totalUnits")
        query.exec(function(err, properties) {
            var surveyids = _.map(properties,function(x) {return x.survey ? x.survey.id.toString() : ""});

            _.remove(surveyids,function(x) {return x == ''})

            query = SurveySchema.find({_id: {$in : surveyids}});
            query.select("date");

            query.exec(function(err, surveys) {
                var final = [];
                properties.forEach(function(p) {
                    p.comps = _.map(p.comps,"id")
                    if (!p.survey) {
                        final.push({_id: p._id, name: p.name, compids: p.comps, totalUnits: p.totalUnits});
                    } else {
                        var survey = _.find(surveys, function (x) {
                            return x._id.toString() == p.survey.id.toString();
                        });

                        if (!survey) {
                            final.push({_id: p._id, name: p.name, compids: p.comps, totalUnits: p.totalUnits});
                        } else {
                            var date1 = new Date(survey.date);
                            var date2 = new Date();
                            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                            var diffDays = timeDiff / (1000 * 3600 * 24);

                            if (diffDays >= 9) {
                                final.push({
                                    _id: p._id,
                                    name: p.name,
                                    date: survey.date,
                                    occupancy: p.survey.occupancy,
                                    ner: p.survey.ner,
                                    compids: p.comps,
                                    totalUnits: p.totalUnits
                                });
                            }
                        }

                    }
                })
                callback(final);
            });


        });



    },
    getAmenityCounts:function(callback) {
        var o = {};

        o.query = {};
        o.scope = {};        
        o.map = function () {
            this.location_amenities.forEach(function (a) {
                emit({amenity: a.toString(), type: 'Location'}, {count: 1});
            })

            this.community_amenities.forEach(function (a) {
                emit({amenity: a.toString(), type: 'Community'}, {count: 1});
            })

            var fps = {};
            this.floorplans.forEach(function (fp) {
                fp.amenities.forEach(function (a) {
                    fps[a.toString()] = true;
                })
            })

            for (var a in fps) {
                emit({amenity: a, type: 'Floorplan'}, {count: 1});
            }
        }

        o.reduce = function (k, vals) {
            var reduced = {count: 0};

            vals.forEach(function (val) {
                reduced.count += val.count;
            });


            return reduced;
        }
        PropertySchema.mapReduce(o, function (err, obj) {
            var counts = {};
            // console.log(obj);
            obj.forEach(function(o) {
                var key = o._id.amenity.toString().replace('ObjectId("','').replace('")','');
                counts[key] = (counts[key] || 0) + o.value.count;
            })
            callback(err, counts);
        });
        
            
    },
    linkComp:function(operator,context,revertedFromId,subjectid, compid, callback) {
        CompsService.linkComp(operator,context,revertedFromId, true, subjectid,compid,callback);
    },
    saveCompLink:function(operator,context,revertedFromId,subjectid, compid, floorplans, callback, skipAudit) {
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

                //This is the current list of comped floorplans
                var old = isLinked.floorplans.map(function(x) {return x.toString()})

                //This is the list of selected included floorplans of the comp from the subject's perspective, the caller passes this list in
                var updated = _.uniq(floorplans.map(function(x) {return x.toString()}));

                // This is the full list of real floorplans of the comp
                var full = _.pluck(comp.floorplans,"id").map(function(x) {return x.toString()})


                //Remove anything in the updated list that is no longer a valid floorplan
                _.remove(updated, function(u) {return full.indexOf(u) == -1 });

                //console.log(updated.sort(),full.sort());
                var excluded = !_.isEqual(full.sort(), updated.sort())

                var update = {$set: {'comps.$.floorplans': floorplans, 'comps.$.excluded': excluded}};

                // if (_.isEqual(old.sort(), updated.sort())) {
                //     return callback([{msg: 'Unable to update comp links, no changes detected'}])
                // }

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

                    if (!skipAudit && (addedData.length > 0 || removedData.length > 0)) {
                        AuditService.create({
                            operator: operator,
                            property: subj,
                            type: 'links_updated',
                            revertedFromId: revertedFromId,
                            description: subj.name + " + " + comp.name + " (" + added.length + " Added, " + removed.length + " Removed)",
                            context: context,
                            data: [{
                                description: "Subject: " + subj.name,
                                id: subj._id
                            }, {
                                description: "Comp: " + comp.name,
                                id: comp._id
                            },].concat(addedData).concat(removedData)
                        })
                    }


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
                    return x.id.toString() == compid.toString()
                })

                console.log(isLinked);

                if (!isLinked) {
                    return callback([{msg: 'Unable to remove comp, it is not currently attached to subject property.'}])
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

                    AuditService.create({
                        operator: operator,
                        property: comp,
                        type: 'property_unlinked',
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
        if (!criteria.ids && !criteria.propertyid) {
            return callback('Error', null);
        }
        var query = SurveySchema.find();

        if (criteria.ids) {
            query = query.where('_id').in(criteria.ids);
        }

        if (criteria.propertyid) {
            query = query.where('propertyid').equals(criteria.propertyid);
        }

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

                if (surveys[i].floorplans) {
                    surveys[i].floorplans.forEach(function (fp, j) {
                        delete surveys[i].floorplans[j].amenities;
                    })
                }
            })
            callback(err,surveys)
        })
    },
    search: function(Operator, criteria, callback) {
        var ObjectId = require('mongoose').Types.ObjectId;
        criteria.permission = criteria.permission || ['PropertyView'];

        if (!criteria.permission.length) {
            criterma.permission = [criteria.permission];
        }

        criteria.search = (criteria.search || '').trim();

        async.parallel({
            permissions: function(callbackp) {
                if (Operator.memberships.isadmin === true) {
                    callbackp(null,[]);
                } else {
                    AccessService.getPermissions(Operator, criteria.permission, function(permissions) {
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

            //if (criteria.permission[0]=='PropertyView') {
            //    console.log(criteria, all.permissions, Operator.memberships, Operator._id)
            //}

            var query = PropertySchema.find();
            if (criteria._id) {
                criteria.ids = criteria.ids || [];
                criteria.ids.push(criteria._id);
            }

            if (criteria.ids) {
                criteria.ids = criteria.ids.map(function(x) {return x.toString()})
            }

            if (criteria.exclude) {
                criteria.exclude = criteria.exclude.map(function(x) {return x.toString()})
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

            if (criteria.needsApproval != null) {
                criteria.select = "id name loc"
                query = query.where("needsApproval").equals(true);
            }
            
            if (criteria.orgid != null) {
                query = query.where("orgid").equals(criteria.orgid);
            }

            if (criteria.noorgid) {
                query = query.exists("orgid", false);
            }

            if (criteria.amenity) {
                query = query.or([
                    {"community_amenities": criteria.amenity},
                    {"community_amenities": new ObjectId(criteria.amenity)},
                    {"location_amenities": criteria.amenity},
                    {"location_amenities": new ObjectId(criteria.amenity)},
                    {"floorplans.amenities": criteria.amenity},
                    {"floorplans.amenities": new ObjectId(criteria.amenity)},

                ])
            }

            query = query.sort(criteria.sort || "name");

            if (criteria.select !== '*') {
                if (criteria.search != '') {
                    var s = new RegExp(criteria.search, "i")
                    query = query.or([{'name': s}, {'address': s}, {'city': s}, {'state': s}]);
                    query = query.select(criteria.select || '_id name address city state zip');
                } else {
                    query = query.select(criteria.select || '_id name');
                }
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


                all = null;

                if (criteria.needsApproval != null) {
                    async.eachLimit(props, 10, function(prop, callbackp) {
                        PropertySchema.find(
                            {
                            loc: {
                                $near: prop.loc,
                                $maxDistance: .1 / 6371
                            },
                                _id : {$ne: prop._id},
                                active:true
                        }).select("_id name loc").exec(function(err, dupes) {
                            prop.dupes = _.map(dupes, function(x) {return x.name}).join(", ");
                            callbackp();
                        });

                    }, function(err) {
                        async.eachLimit(props, 10, function(prop, callbackp) {
                            PropertySchema.find(
                                {
                                    name: {$regex: new RegExp("^"+prop.name+"$", "i")},
                                    _id : {$ne: prop._id},
                                    active:true
                                }).select("_id name loc").exec(function(err, dupes) {
                                prop.dupeName = dupes.length > 0;
                                callbackp();
                            });

                        }, function(err) {
                            callback(err, props, lookups)
                        })
                    })

                } else {
                    callback(err, props, lookups)
                }
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
    Approve : function(operator, id, context, callback)  {
        var modelErrors = [];

        if (!id)
        {
            modelErrors.push({msg : 'Invalid property id.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }
        var query = {_id: id};
        var update = {needsApproval: undefined};
        var options = {new: true};

        PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {

            if (err) {
                modelErrors.push({msg: 'Unable to update property.'});
                callback(modelErrors, null);
                return;
            }

            AuditService.create({operator: operator, property: saved, type: 'property_approved', description: saved.name + ": Approved"})

            return callback(err, saved)
        })
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

            var data = [{description: "Survey Date: ", date: survey.date, survey: survey}];

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
                    description: prop.name,
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
                copy.leased = lastsurvey.leased;
                copy.renewal = lastsurvey.renewal;
                copy.weeklyleases = lastsurvey.weeklyleases;
                copy.weeklytraffic = lastsurvey.weeklytraffic;
                copy.notes = lastsurvey.notes;


                var data = [{description: "Survey Date: ", date: lastsurvey.date, survey: copy}];

                if (lastsurvey.notes !== survey.notes) {
                    data.push({description: "Notes: " + (typeof lastsurvey.notes == 'undefined' || lastsurvey.notes == null || lastsurvey.notes == '' ? 'N/A' : lastsurvey.notes ) + " => " + (typeof survey.notes == 'undefined' || survey.notes == null || survey.notes == '' ? 'N/A' : survey.notes )})
                }

                if (lastsurvey.occupancy !== survey.occupancy) {
                    data.push({description: "Occupancy: " + lastsurvey.occupancy + "% => " + survey.occupancy + "%"})
                }

                if (lastsurvey.leased !== survey.leased) {
                    data.push({description: "Leased: " + (typeof lastsurvey.leased == 'undefined' || lastsurvey.leased == null ? 'N/A' : lastsurvey.leased + '%') + " => " + (typeof survey.leased == 'undefined' || survey.leased == null ? 'N/A' : survey.leased + "%")})
                }

                if (lastsurvey.renewal !== survey.renewal) {
                    data.push({description: "Renewal: " + (typeof lastsurvey.renewal == 'undefined' || lastsurvey.renewal == null ? 'N/A' : lastsurvey.renewal + '%') + " => " + (typeof survey.renewal == 'undefined' || survey.renewal == null ? 'N/A' : survey.renewal + "%")})
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
                        data.push({description: PropertyHelperService.floorplanName(fp) + ": (N/A) => " + PropertyHelperService.floorplanRentName(fp) })
                    }
                    else if (oldfp.rent !== fp.rent || oldfp.concessions !== fp.concessions) {
                        data.push({description: PropertyHelperService.floorplanName(oldfp) + ": " + PropertyHelperService.floorplanRentName(oldfp) + " => " + PropertyHelperService.floorplanRentName(fp) })
                    }
                })

                lastsurvey.floorplans = survey.floorplans;
                lastsurvey.occupancy = survey.occupancy;
                lastsurvey.leased = survey.leased;
                lastsurvey.renewal = survey.renewal;
                lastsurvey.weeklyleases = survey.weeklyleases;
                lastsurvey.weeklytraffic = survey.weeklytraffic;
                lastsurvey.notes = survey.notes;

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
                //if we pass in the date, pick last survey before the date
                PropertySchema.findOne({_id: id}, function (err, prop) {
                    subject = prop;
                    callbackw(null, (prop.survey ? prop.survey.id : null), survey.date)
                })
            },
            function(surveyid, date, callbackw) {
                if (date) {
                    SurveySchema.findOne({date:{$lt : date},propertyid:subject._id}, function(err, lastsurvey) {
                        callbackw(null,lastsurvey)
                    })
                }
                else
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

            lastsurvey.occupancy = lastsurvey.occupancy || 'N/A';
            lastsurvey.weeklyleases = lastsurvey.weeklyleases || 'N/A';
            lastsurvey.weeklytraffic = lastsurvey.weeklytraffic || 'N/A';
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
            n.leased = survey.leased;
            n.renewal = survey.renewal;
            n.weeklyleases = survey.weeklyleases;
            n.weeklytraffic = survey.weeklytraffic;
            n.date = survey.date || Date.now();
            n.exclusions = exclusions;
            n.notes = survey.notes;

            if (subject.orgid && operator.orgs[0]._id.toString() == subject.orgid.toString()) {
                n.doneByOwner = true;
            }

            var data = [{description: "Survey Date: ", date: n.date, id: n._id}];


            if (lastsurvey.notes !== n.notes) {
                data.push({description: "Notes: " + (typeof lastsurvey.notes == 'undefined' || lastsurvey.notes == null || lastsurvey.notes == '' ? 'N/A' : lastsurvey.notes ) + " => " + (typeof n.notes == 'undefined' || n.notes == null || n.notes == '' ? 'N/A' : n.notes )})
            }

            if (lastsurvey.occupancy !== n.occupancy) {
                data.push({description: "Occupancy: " + lastsurvey.occupancy + "% => " + n.occupancy + "%"})
            }
            if (lastsurvey.leased !== n.leased) {
                data.push({description: "Leased: " + (typeof lastsurvey.leased == 'undefined' || lastsurvey.leased == null ? 'N/A' : lastsurvey.leased + "%") + " => " + (typeof n.leased == 'undefined' || n.leased == null ? 'N/A' : n.leased + "%")})
            }
            if (lastsurvey.renewal !== n.renewal) {
                data.push({description: "Renewal: " + (typeof lastsurvey.renewal == 'undefined' || lastsurvey.renewal == null ? 'N/A' : lastsurvey.renewal + "%") + " => " + (typeof n.renewal == 'undefined' || n.renewal == null ? 'N/A' : n.renewal + "%")})
            }
            if (lastsurvey.weeklyleases !== n.weeklyleases) {
                data.push({description: "Leases/Week: " + lastsurvey.weeklyleases + " => " + n.weeklyleases })
            }

            if (lastsurvey.weeklytraffic !== n.weeklytraffic) {
                data.push({description: "Traffic/Week: " + lastsurvey.weeklytraffic + " => " + n.weeklytraffic })
            }

            n.floorplans.forEach(function(fp) {
                if (typeof fp.description == "undefined" || fp.description == null) {
                    fp.description = "";
                }

                var oldfp = _.find(lastsurvey.floorplans, function(x) {return x.id == fp.id});

                if (!oldfp) {
                    data.push({description: PropertyHelperService.floorplanName(fp) + ": (N/A) => " + PropertyHelperService.floorplanRentName(fp) })
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
    getLastSurveyStats: function(options,subject, comps, callback) {
        var surveyids = _.pluck(comps,"survey.id");

        //get all surveys of comps at once to be efficient
        SurveySchema.find().where("_id").in(surveyids).exec(function(err, surveys) {
            comps.forEach(function(comp) {
                //match each survey to a comp
                var links = _.find(subject.comps, function(x) {return x.id == comp._id})

                //if there is a survey go here:
                if (comp.survey) {
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

                        if (options.injectFloorplans) {
                            //Inject any actual floorplans into the survey that are not in the last survey
                            comp.floorplans.forEach(function (cfp) {
                                if (!_.find(s.floorplans, function (sfp) {
                                        return sfp.id.toString() == cfp.id.toString()
                                    })) {
                                    s.floorplans.push(cfp);
                                }
                            })
                        }

                        comp.survey.occupancy = s.occupancy;
                        comp.survey.leased = s.leased;
                        comp.survey.renewal = s.renewal;
                        comp.survey.weeklyleases = s.weeklyleases;
                        comp.survey.weeklytraffic = s.weeklytraffic;
                        SurveyHelperService.floorplansToSurvey(comp.survey, s.floorplans, links, options.hide, options.nerPlaces);
                    }

                } else {
                    //No surveys at all, create a fake survey with current floorplan data but no rent data
                    comp.survey = {};
                    comp.survey.tier = "danger";

                    if (options.injectFloorplans) {
                        SurveyHelperService.floorplansToSurvey(comp.survey, comp.floorplans, links, options.hide, options.nerPlaces);
                    }
                    else {
                        SurveyHelperService.floorplansToSurvey(comp.survey, [], links, options.hide, options.nerPlaces);
                    }
                }
            });
            return callback();
        })
    }
}