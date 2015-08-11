'use strict';
var PropertySchema= require('../schemas/propertySchema')
var SurveySchema= require('../schemas/surveySchema')
var GeocodeService = require('../../utilities/services/geocodeService')
var DateService = require('../../utilities/services/dateService')
var AccessService = require('../../access/services/accessService')
var async = require("async");
var _ = require("lodash")
var OrgService = require('../../organizations/services/organizationService')
var AmenityService = require('../../amenities/services/amenityService')
var uuid = require('node-uuid');
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')

var WEEK = 7 * 24 * 60 * 60 * 1000;

var fees  = {
    application_fee : 'Application fee',
    lease_terms: 'Lease terms',
    short_term_premium: 'Short term premium',
    refundable_security_deposit: 'Refundable security deposit',
    administrative_fee: 'Administrative fee',
    non_refundable_pet_deposit: 'Non refundable pet deposit',
    pet_deposit: 'Pet deposit',
    pet_rent: 'Pet rent'
}

module.exports = {
    fees: fees,
    flattenAllCompFloorplans: function(comps, subjectid) {
        var subjcomps = _.find(comps,function(x) {return x._id.toString() == subjectid.toString()}).comps;
        return _.flatten(_.pluck(_.flatten(subjcomps),"floorplans"));
    },
    linkComp:function(operator,context,revertedFromId,subjectid, compid, callback) {
        linkComp(operator,context,revertedFromId, true, subjectid,compid,callback);
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
                        addedData.push({type:'added', id: fp.id.toString(), description: 'Added: ' + floorplanName(fp)})
                    })
                }

                if (removed && removed.length > 0) {
                    _.filter(comp.floorplans, function(x) {return removed.indexOf(x.id.toString()) > -1}).forEach(function(fp) {
                        removedData.push({type:'removed', id: fp.id.toString(), description: 'Removed: ' + floorplanName(fp)})
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
                AmenityService.search(function(err, amenities) {
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
                        lookups.fees = fees;
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
    create: function(property, callback) {
        async.parallel({
            geo: function (callbackp) {

                GeocodeService.geocode(property.address + ' ' + property.city + ' ' + property.state + ' ' + property.zip, true, function (err, res, fromCache) {
                    //console.log(res[0].latitude, res[0].longitude);
                    callbackp(err, res[0])
                });
            },
            roles: function (callbackp) {
                AccessService.getRoles(function(err, roles) {
                    callbackp(err, roles)
                })

            },
            amenities: function (callbackp) {
                AmenityService.search(function(err, amenities) {
                    callbackp(err, amenities)
                })

            }

        },  function(err, all)
            {

                //find all amenities by name and conver to id;
                var community_amenities = [];
                (property.community_amenities || []).forEach(function(pa) {
                    var am = _.find(all.amenities, function(a) {return pa == a.name && a.type == 'Community'})
                    if (am) {
                        community_amenities.push(am._id);
                    }
                })

                var location_amenities = [];
                (property.location_amenities || []).forEach(function(pa) {
                    var am = _.find(all.amenities, function(a) { return pa == a.name && a.type == 'Location'})
                    if (am) {
                        location_amenities.push(am._id);
                    }
                })

                //////////////////
                var CMs = [];
                var permissions = [];
                if (property.orgid) {
                    //if org of property is provided, assign manage to all CMs for that org
                    CMs = _.filter(all.roles, function(x) {return x.orgid == property.orgid.toString() && x.tags.indexOf('CM') > -1})

                    CMs.forEach(function(x) {
                        permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyManage'})
                    })

                }

                //and assign view opermissions to all non admins and not POs
                var viewers = _.filter(all.roles, function(x) {
                    return x.tags.indexOf('CM') > -1 || x.tags.indexOf('RM') > -1 || x.tags.indexOf('BM') > -1})


                viewers.forEach(function(x) {
                    permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyView'})
                })

                var totalUnits = 0;

                property.floorplans = property.floorplans || [];

                property.floorplans.forEach(function(fp) {
                    totalUnits += (fp.units || 0);

                    if (!fp.id) {
                        fp.id = uuid.v1();
                    }

                    var amenities = [];
                    (fp.amenities || []).forEach(function(pa) {
                        var am = _.find(all.amenities, function(a) { return pa == a.name && a.type == 'Unit'})
                        if (am) {
                            amenities.push(am._id);
                        }
                    })
                    fp.amenities = amenities;

                })


                var n = new PropertySchema();

                n.loc = [all.geo.latitude, all.geo.longitude]
                n.name = property.name;
                n.address = property.address;
                n.city = property.city;
                n.state = property.state;
                n.zip = property.zip;
                n.phone = property.phone;
                n.owner = property.owner;
                n.contactEmail = property.contactEmail;
                n.contactName = property.contactName;
                n.management = property.management;
                n.yearBuilt = property.yearBuilt;
                n.yearRenovated = property.yearRenovated
                n.constructionType = property.constructionType;
                n.notes = property.notes;
                n.fees = property.fees;
                n.active = true;
                n.orgid = property.orgid;
                n.floorplans = property.floorplans;
                n.totalUnits = totalUnits;
                n.location_amenities = location_amenities;
                n.community_amenities = community_amenities;
                n.comps = [];

                n.date = Date.now();

                n.save(function (err, prop) {

                    if (err) {
                        return callback(err, null)
                    }

                    if (permissions.length > 0 ) {
                        permissions.forEach(function(x) {
                            x.resource = prop._id.toString();
                        })
                    }

                    async.eachLimit(permissions, 10, function(permission, callbackp){
                        AccessService.createPermission(permission, function (err, perm) {
                            callbackp(err, perm)
                        });
                    }, function(err) {
                        //link to yourself
                        linkComp(null,null,null,false,prop._id, prop._id,function() {
                            callback(err, prop);
                        })
                    });
                });

            }
        );

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

                AuditService.create({operator: operator, property: saved, type: 'property_status', revertedFromId : revertedFromId, description: property.active ? "Inactive => Active" : "Active => Inactive", context: context, data : [{description: "Previous: " + (property.active ? "Inactive" : "Active"), status: !property.active}]})

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

                AuditService.create({
                    operator: operator,
                    property: prop,
                    type: 'survey_deleted',
                    revertedFromId: revertedFromId,
                    description: prop.name + ": " + moment(survey.date).format("MM/DD/YYYY"),
                    context: context,
                    data: data
                })

                callback(null);

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
                        data.push({description: floorplanName(fp) + ": " + floorplanRentName(fp) })
                    }
                    else if (oldfp.rent !== fp.rent || oldfp.concessions !== fp.concessions) {
                        data.push({description: floorplanName(oldfp) + ": " + floorplanRentName(oldfp) + " => " + floorplanRentName(fp) })
                    }
                })

                lastsurvey.floorplans = survey.floorplans;
                lastsurvey.occupancy = survey.occupancy;
                lastsurvey.weeklyleases = survey.weeklyleases;
                lastsurvey.weeklytraffic = survey.weeklytraffic;

                lastsurvey.save(function (err, created) {
                    var totUnits = _.sum(survey.floorplans, function (fp) {
                        return fp.units
                    });

                    if (totUnits > 0 && subject.survey.id.toString() == surveyid.toString()) {
                        var ner = Math.round(_.sum(survey.floorplans, function (fp) {
                                return (fp.rent - fp.concessions / 12) * fp.units
                            }) / totUnits);

                        var s = {
                            id: created._id,
                            occupancy: survey.occupancy,
                            ner: ner,
                            weeklyleases: survey.weeklyleases,
                            weeklytraffic: survey.weeklytraffic
                        }
                        var query = {_id: id};
                        var update = {survey: s};
                        var options = {new: true};

                        PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                            callback(err, created)
                        })
                    }
                    else {
                        callback(err, created)
                    }

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
                getSubjectExclusions(id, compFloorplans, function(exclusions) {
                    callbackw(null,lastsurvey,exclusions)
                })
            }
        ], function(err,lastsurvey, exclusions ) {

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
                    data.push({description: floorplanName(fp) + ": " + floorplanRentName(fp) })
                }
                else if (oldfp.rent !== fp.rent || oldfp.concessions !== fp.concessions) {
                    data.push({description: floorplanName(oldfp) + ": " + floorplanRentName(oldfp) + " => " + floorplanRentName(fp) })
                }
            })

            n.save(function (err, created) {
                data[0].id=created._id;
                var totUnits = _.sum(survey.floorplans, function (fp) {
                    return fp.units
                });

                if (totUnits > 0) {
                    var ner = Math.round(_.sum(survey.floorplans, function (fp) {
                            return (fp.rent - fp.concessions / 12) * fp.units
                        }) / totUnits);

                    var s = {
                        id: created._id,
                        occupancy: n.occupancy,
                        ner: ner,
                        weeklyleases: n.weeklyleases,
                        weeklytraffic: n.weeklytraffic
                    }
                    var query = {_id: id};
                    var update = {survey: s};
                    var options = {new: true};

                    PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                        callback(err, created)
                    })
                }
                else {
                    callback(err, created)
                }

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
    getSubjects: function(compid, criteria, callback) {
        getSubjects(compid, criteria, callback)
    },
    getPoints: function(hide,subject,comps,summary,bedrooms,daterange,offset,show,callback) {

        var propertyids = _.pluck(comps,"_id");
        if (!propertyids || propertyids.length == 0) {
            return callback({});
        }

        var query = SurveySchema.find();

        query = query.where("propertyid").in(propertyids);
        var dr = DateService.convertRangeToParts(daterange);

        if (daterange.daterange != "Lifetime") {
            query = query.where("date").gte(dr.start).lte(dr.end);
        }

        var select = "_id date propertyid";

        if (show.occupancy) {
            select += "  occupancy"
        }

        if (show.leases) {
            select += "  weeklyleases"
        }

        if (show.traffic) {
            select += "  weeklytraffic"
        }

        if (show.ner) {
            select += " exclusions floorplans.id floorplans.rent floorplans.concessions floorplans.bedrooms floorplans.bathrooms floorplans.units"
        }

        query = query.select(select)

        query = query.sort("date");

        query.exec(function(err, surveys) {
            if (err) {
                return callback({});
            }

            var bedroomBeakdown = [];

            var points = {};
            var excluded = false;

            if (show.bedrooms){
                var includedFps = _.filter(comps[0].survey.floorplans, function (x) {
                    if (x.excluded) {
                        excluded = true;
                    }
                    return !hide || !x.excluded
                });

                bedroomBeakdown =  _.uniq(_.pluck(includedFps, 'bedrooms'));
            }


            surveys.forEach(function(s) {

                var dateKey = parseInt(moment.utc(s.date).add(offset,"minute").startOf("day").subtract(offset,"minute").format('x'));

                points[s.propertyid] = points[s.propertyid] || {};

                if (show.graphs !==  true) {
                    points[s.propertyid].surveys = points[s.propertyid].surveys || {};
                    points[s.propertyid].surveys[dateKey] = s._id;
                }

                if (show.occupancy) {
                    points[s.propertyid].occupancy = points[s.propertyid].occupancy || {};
                    points[s.propertyid].occupancy[dateKey] = s.occupancy;
                }
                if (show.leases) {
                    points[s.propertyid].leases = points[s.propertyid].leases || {};
                    points[s.propertyid].leases[dateKey] = s.weeklyleases;
                }

                if (show.traffic) {
                    points[s.propertyid].traffic = points[s.propertyid].traffic || {};
                    points[s.propertyid].traffic[dateKey] = s.weeklytraffic;
                }

                if (show.ner) {
                    points[s.propertyid].ner = points[s.propertyid].ner || {};

                    var nerPoint = getNerPoint(s, bedrooms, hide, subject, comps);
                    points[s.propertyid].ner[dateKey] = nerPoint.value;

                    if (nerPoint.excluded) {
                        excluded = true;
                    }

                    bedroomBeakdown.forEach(function(b) {
                        points[s.propertyid][b] = points[s.propertyid][b] || {};
                        points[s.propertyid][b][dateKey] = points[s.propertyid][b][dateKey] || {};

                        nerPoint = getNerPoint(s, b, hide, subject, comps);
                        points[s.propertyid][b][dateKey] = nerPoint.value;
                    })

                }

            })

            //console.log(points["5577c0f1541b40040baaa5eb"].occupancy)
            for (var prop in points) {

                if (show.graphs === true) {
                    if (show.occupancy) {
                        points[prop].occupancy = normailizePoints(points[prop].occupancy, offset, dr);
                    }
                    if (show.traffic) {
                        points[prop].traffic = normailizePoints(points[prop].traffic, offset, dr);
                    }
                    if (show.leases) {
                        points[prop].leases = normailizePoints(points[prop].leases, offset, dr);
                    }

                    if (show.ner) {
                        points[prop].ner = normailizePoints(points[prop].ner, offset, dr);

                        bedroomBeakdown.forEach(function (b) {
                            points[prop][b] = normailizePoints(points[prop][b], offset, dr);
                        })
                    }
                }

                if (show.occupancy) {
                    points[prop].occupancy = objectToArray(points[prop].occupancy);
                }
                if (show.traffic) {
                    points[prop].traffic = objectToArray(points[prop].traffic);
                }
                if (show.leases) {
                    points[prop].leases = objectToArray(points[prop].leases);
                }
                if (show.ner) {
                    points[prop].ner = objectToArray(points[prop].ner);
                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = objectToArray(points[prop][b]);
                    })
                }

                if (show.occupancy) {
                    points[prop].occupancy = extrapolateMissingPoints(points[prop].occupancy);
                }
                if (show.traffic) {
                    points[prop].traffic = extrapolateMissingPoints(points[prop].traffic);
                }
                if (show.leases) {
                    points[prop].leases = extrapolateMissingPoints(points[prop].leases);
                }

                if (show.ner) {
                    points[prop].ner = extrapolateMissingPoints(points[prop].ner);
                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = extrapolateMissingPoints(points[prop][b]);
                    })
                }

            }

            if (summary) {
                var newpoints = {averages:{}}
                if (show.occupancy) {
                    getSummary(points, subject._id, newpoints, 'occupancy');
                }

                if (show.traffic) {
                    getSummary(points, subject._id, newpoints, 'traffic');
                }

                if (show.leases) {
                    getSummary(points, subject._id, newpoints, 'leases');
                }

                if (show.ner) {
                    getSummary(points, subject._id, newpoints, 'ner');
                }

                points = newpoints;
            }

            points.excluded = excluded;
            callback(points);
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

                    delete comp.survey.id;
                    comp.survey.date = s.date;
                    var daysSince = (Date.now() - s.date.getTime()) / 1000 / 60 / 60 / 24;
                    if (daysSince >= 15) {
                        comp.survey.tier = "danger";
                    } else if (daysSince >= 8) {
                        comp.survey.tier = "warning";
                    }

                    comp.survey.days = daysSince;

                    getSurveyStats(s.floorplans, comp.survey, links, hide);

                    comp.survey.bedrooms = {};

                    for (var i = 0; i < 7; i++) {
                        var temp = _.filter(s.floorplans, function (x) {
                            return x.bedrooms == i
                        });

                        if (temp.length > 0) {
                            comp.survey.bedrooms[i] = {};
                            getSurveyStats(temp, comp.survey.bedrooms[i], links, hide);
                        }
                    }

                    comp.survey.floorplans = s.floorplans;

                    comp.survey.floorplans.forEach(function(fp) {
                        delete fp.amenities;
                        fp.ner = Math.round(fp.rent - (fp.concessions / 12))
                        fp.nersqft = Math.round(fp.ner / fp.sqft * 100) / 100
                        if (links.excluded === true && hide) {
                            links.floorplans = links.floorplans.map(function(x) {return x.toString()})

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
            });
            return callback();
        })
    }
}

function getNerPoint(s, bedrooms, hide, subject, comps) {
    var fps = _.flatten(s.floorplans);

    if (bedrooms > -1) {
        fps = _.filter(fps, function(x) {return x.bedrooms == bedrooms})
    }

    var excluded = false;
    if (hide) {
        var excfps = [];

        //remove any historical exclusions saved in each survey
        if (s.exclusions && s.exclusions.length > 0) {
            var exc = _.find(s.exclusions, function(x) {return x.subjectid == subject._id});

            if (exc) {
                excfps = excfps.concat(exc.floorplans.map(function(x) {return x.toString()}));
            }
        }

        //compare current floorplan to current exclusions to get a current exclusion list
        var currentfps = _.pluck(_.find(comps, function(x) {return x._id == s.propertyid}).floorplans,"id").map(function(x) {return x.toString()});

        var incfps = _.find(subject.comps, function(x) {return x.id == s.propertyid}).floorplans.map(function(x) {return x.toString()});

        excfps = excfps.concat(_.difference(currentfps,incfps))

        if (excfps.length > 0) {
            var removed = _.remove(fps, function(x) {return excfps.indexOf(x.id.toString()) > -1});
            if (removed && removed.length > 0) {
                excluded = true;
            }
        }
    }

    var tot = _.sum(fps, function(x) {return x.units});
    var ret = _.sum(fps, function(x) {return (x.rent - x.concessions / 12) * x.units / tot})



    return {value: ret, excluded : excluded};
}
function getSummary(points, subjectid, newpoints, dimension) {
    newpoints['averages'][dimension] = [];
    for (var prop in points) {
        if (prop == subjectid) {
            newpoints[prop] = points[prop];
        } else {
            newpoints['averages'][dimension] = newpoints['averages'][dimension].concat(points[prop][dimension]);
        }
    }

    var g = _.chain(newpoints['averages'][dimension]).groupBy("d").map(function(v, k) {
        return {
            d: parseInt(k),
            v: _.sum(v, function(x) {return x.v }) / v.length
        } }).value();

    newpoints['averages'][dimension] = g;
}
function extrapolateMissingPoints (pts) {

    var Count = pts.length;

    if (Count < 2)
    {
        return pts;
    }

    var i = 0;
    var Current;
    var Last = null;
    var Delta = 0;

    while (i < Count)
    {
        Current = pts[i];
        if (Last != null && Current.d - Last.d > WEEK)
        {
            Delta = (Current.v - Last.v) / (Current.d - Last.d) * WEEK;
            Current =
            {
                d: Last.d + WEEK,
                v: Last.v + Delta,
                f: true
            };

            pts.splice(i, 0, Current);

            i--;
            Count++;
        }

        Last = Current;
        i++;
    }

    return pts;
}

function objectToArray(obj) {
    var ar = [];

    for (var k in obj) {
        ar.push({d: parseInt(k), v:obj[k] } );
    }

    ar = _.sortBy(ar, function(x) {return x.d});

    return ar;
}

function normailizePoints(points, offset, dr) {
    if (points == {}) {
        return {}
    }

    var monday = parseInt(moment.utc().add(offset,"minute").day("Monday").startOf("day").subtract(offset,"minute").format('x'))
    var nextMonday =  monday + WEEK;

    var minDate;

    for (minDate in points) break;

    var ret = {};

    var first = null;

    while (parseInt(minDate) < nextMonday) {
        var rangePoints = [];

        for (var d in points) {
            if (parseInt(d) >= monday && parseInt(d) < nextMonday) {
                rangePoints.push(points[d])
            }
        }

        if (rangePoints.length > 0) {
            //console.log(rangePoints)
            ret[monday] = _.sum(rangePoints) / rangePoints.length;

            if (first == null) {
                first = ret[monday];
            }
        }


        monday =  monday - WEEK;
        nextMonday =  nextMonday - WEEK;
    }

    var today = parseInt(moment.utc(dr.end).add(offset,"minute").startOf("day").subtract(offset,"minute").format('x'))

    ret[today] = first;

    return ret;
}

function getSurveyStats(floorplans, survey, links, hide) {

    var fps = _.cloneDeep(floorplans);

    var fpids = _.pluck(floorplans, "id").map(function(x) {return x.toString()})

    var totUnits = _.sum(fps, function (fp) {
        return fp.units
    });
    survey.totUnits = totUnits;

    if (links.excluded === true && hide) {
        links.floorplans = links.floorplans.map(function(x) {return x.toString()})

        fps = _.filter(fps, function(x) {
            return links.floorplans.indexOf(x.id.toString()) > -1})

        var excluded = _.find(fpids, function(x) {
            return links.floorplans.indexOf(x.toString()) == -1})

        if (excluded) {
            survey.excluded = true;
        }
    }

    totUnits = _.sum(fps, function (fp) {
        return fp.units
    });

    if (totUnits > 0) {
        survey.sqft = Math.round(_.sum(fps, function (fp) {
                return (fp.sqft) * fp.units
            }) / totUnits);
        survey.rent = Math.round(_.sum(fps, function (fp) {
                return (fp.rent) * fp.units
            }) / totUnits);
        survey.concessions = Math.round(_.sum(fps, function (fp) {
                return (fp.concessions) * fp.units
            }) / totUnits);
        survey.ner = Math.round(survey.rent - (survey.concessions / 12))
        survey.nersqft = Math.round(survey.ner / survey.sqft * 100) / 100
    }
}
function getSubjects(compid, criteria, callback) {

    var ObjectId = require('mongoose').Types.ObjectId;
    var query = PropertySchema.find({'comps.id': new ObjectId(compid)});
    query.select(criteria.select);
    query.exec(callback);

}

function getSubjectExclusions (compid, compFloorplans, callback) {
    getSubjects(compid,{select:"_id name comps"}, function(err, obj) {
        var exclusions = [];

        obj.forEach(function(p) {
            var comp = _.find(p.comps, function(c) {return c.id.toString() == compid})
            if (comp.excluded) {
                exclusions.push({subjectid: p._id, floorplans: _.difference(compFloorplans, comp.floorplans)});
            }
        })

        callback(exclusions);
    });

}
function linkComp (operator, context, revertedFromId, logHistory, subjectid, compid, callback) {
    PropertySchema.findOne({_id:subjectid}, function(err, subj) {
        if (_.find(subj.comps, function(c) {return c.id.toString() == compid.toString()})) {
            return callback("Comp already exists", null);
        }

        PropertySchema.findOne({_id: compid}, function (err, comp) {
            if (err) {
                callback(err, null)
            } else {

                var ObjectId = require('mongoose').Types.ObjectId;
                var link = {id: new ObjectId(compid), floorplans: _.pluck(comp.floorplans, "id")}
                var query = {_id: subjectid};
                var update = {$addToSet: {comps: link}};
                var options = {new: true};

                PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {

                    if (logHistory) {
                        AuditService.create({
                            operator: operator,
                            property: saved,
                            type: 'comp_linked',
                            revertedFromId: revertedFromId,
                            description: subj.name + " + " + comp.name,
                            context: context,
                            data: [{
                                description: "Subject: " + subj.name,
                                id: subj._id
                            }, {description: "Comp: " + comp.name, id: comp._id},]
                        })
                    }
                    return callback(err, saved)
                })
            }
        })
    })

}
function floorplanName(fp) {
    var name = fp.bedrooms + "x" + fp.bathrooms;

    if (fp.description && fp.description != "") {
        name += " " + fp.description;
    } else {
        name += " - ";
    }

    name += " " + fp.sqft + " Sqft";
    name += ", " + fp.units + " Units";

    return name
}

function floorplanRentName(fp) {
    return "($" + fp.rent + " gmr, $" + fp.concessions + " cons/12)";
}