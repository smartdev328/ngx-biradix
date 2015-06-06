'use strict';
var PropertySchema= require('../schemas/propertySchema')
var GeocodeService = require('../../utilities/services/geocodeService')
var AccessService = require('../../access/services/accessService')
var async = require("async");
var _ = require("lodash")
var OrgService = require('../../organizations/services/organizationService')
var AmenityService = require('../../amenities/services/amenityService')
var uuid = require('node-uuid');

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
    linkComp:function(subjectid, compid, callback) {
        linkComp(subjectid,compid,callback);
    },
    saveCompLink:function(subjectid, compid, floorplans, callback) {
        var ObjectId = require('mongoose').Types.ObjectId;
        var query = {_id: new ObjectId(subjectid), 'comps.id': new ObjectId(compid)};
        var update = {$set: {'comps.$.floorplans': floorplans}};

        PropertySchema.update(query, update, function(err, saved) {
            return callback(err, saved)
        })
    },
    unlinkComp:function(subjectid, compid, callback) {
        var ObjectId = require('mongoose').Types.ObjectId;
        var query = {_id: new ObjectId(subjectid)};
        var update = {$pull: {comps : {id : ObjectId(compid)}}};

        PropertySchema.update(query, update, function(err, saved) {
            return callback(err, saved)
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
                        //calculate summary for autocomplete
                        props.forEach(function(x,i) {
                                props[i].summary = x.name + "<br><i>" + x.address + ", " + x.city + ", " + x.state + "</i>";
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
                        linkComp(prop._id, prop._id,function() {
                            callback(err, prop);
                        })
                    });
                });

            }
        );

    },
    updateActive : function(property, callback)  {
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

        PropertySchema.findOneAndUpdate(query, update, options, function(err, saved) {

            if (err) {
                modelErrors.push({msg : 'Unable to update property.'});
                callback(modelErrors, null);
                return;
            }

            return callback(err, saved)
        })

    },
}


function linkComp (subjectid, compid, callback) {
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
                    return callback(err, saved)
                })
            }
        })
    })
}