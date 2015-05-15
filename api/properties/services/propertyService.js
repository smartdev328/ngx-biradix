'use strict';
var PropertySchema= require('../schemas/propertySchema')
var GeocodeService = require('../../utilities/services/geocodeService')
var AccessService = require('../../access/services/accessService')
var async = require("async");
var _ = require("lodash")

module.exports = {
    search: function(Operator, criteria, callback) {
        criteria.permission = criteria.permission || 'PropertyView';

        criteria.search = (criteria.search || '').trim();

        async.parallel({
            permissions: function(callbackp) {
                if (Operator.memberships.isadmin) {
                    callbackp(null,[]);
                } else {
                    AccessService.getPermissions(Operator, [criteria.permission], function(permissions) {
                        callbackp(null, permissions)
                    });
                }
            }
        }, function(err, all) {
            var query;

            if (Operator.memberships.isadmin) {
                query = PropertySchema.find();
            }
            else {
                query = PropertySchema.find({'_id': {$in: permissions}});
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


                callback(err,props)
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

            }
        },  function(err, all)
            {
                var CMs = [];
                var viewers = [];
                var permissions = [];
                if (property.orgid) {
                    //if org of property is provided, assign manage to all CMs for that org
                    CMs = _.filter(all.roles, function(x) {return x.orgid == property.orgid.toString() && x.tags.indexOf('CM') > -1})

                    CMs.forEach(function(x) {
                        permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyManage'})
                    })

                }

                //and assign view opermissions to all non admins and not POs
                viewers = _.filter(all.roles, function(x) {
                    return x.tags.indexOf('CM') > -1 || x.tags.indexOf('RM') > -1 || x.tags.indexOf('BM') > -1})


                viewers.forEach(function(x) {
                    permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyView'})
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
                n.management = property.management;
                n.yearBuilt = property.yearBuilt;

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
                        callback(err, prop);
                    });



                });

            }
        );




    }
}