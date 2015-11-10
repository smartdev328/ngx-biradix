var queues = require("../config/queues")
var _ = require('lodash');
var async = require("async");
var request = require('request')
var OrgService = require('../api/organizations/services/organizationService')
var PropertyService = require('../api/properties/services/propertyService')
var CreateService = require('../api/properties/services/createService')
var AmenityService = require('../api/amenities/services/amenityService')
var userService  = require('../api/users/services/userService');
var userCreateService  = require('../api/users/services/userCreateService');
var accessService  = require('../api/access/services/accessService');
var propertyUsersService  = require('../api/propertyusers/services/propertyUsersService');

var context = {ip: '127.0.0.1', user_agent: 'server'}

queues.getImportQueue().consume(function(data,reply) {
    async.parallel({
        systemUser: function(callbackp) {
            console.log('Getting systemUser');
            userService.getSystemUser(function(obj) {
                console.log('Got systemUser');
                var SystemUser = obj.user;
                callbackp(null, SystemUser)
            });
        },
        props: function(callbackp) {
            console.log('Getting props');
            request({url: 'http://platform.biradix.com/seed/props?secret=alex', timeout: 1000 * 60 * 60}, function (error, response, body) {
                console.log('Got props');
                if (!error && response.statusCode == 200) {

                    var props = JSON.parse(body)
                    callbackp(null,props)
                } else {
                    callbackp(error, null);
                }
            })
        },
        orgs: function(callbackp) {
            console.log('Getting orgs');
            OrgService.read(function (err, orgs) {
                console.log('Got orgs');
                callbackp(null, orgs)
            });
        },
        links: function(callbackp) {
            console.log('Getting comps');
            request('http://platform.biradix.com/seed/comps?secret=alex', function (error, response, body) {
                console.log('Got comps');
                if (!error && response.statusCode == 200) {

                    var links = JSON.parse(body)
                    callbackp(null,links)
                } else {
                    callbackp(error, null);
                }
            })
        },
        surveys: function(callbackp) {
            console.log('Getting surveys');
            request('http://platform.biradix.com/seed/surveys?secret=alex', function (error, response, body) {
                console.log('Got surveys');
                if (!error && response.statusCode == 200) {

                    var surveys = JSON.parse(body)
                    callbackp(null,surveys)
                } else {
                    callbackp(error, null);
                }
            })
        },
        roles: function(callbackp) {
            console.log('Getting roles');
            accessService.getRoles({tags:['BM','CM','RM','PO']},function (err, roles) {
                console.log('Got roles');
                callbackp(null, roles)
            });
        },
        amenities: function(callbackp) {
            console.log('Getting amenities');
            var time = new Date();
            AmenityService.search({},function (err, amenities) {
                console.log('Got amenities');
                callbackp(err, amenities)
            })
        },
        users: function(callbackp) {
            console.log('Getting users');
            request('http://platform.biradix.com/seed/users?secret=alex', function (error, response, body) {
                console.log('Got users');
                if (!error && response.statusCode == 200) {

                    var users = JSON.parse(body)
                    callbackp(null,users)
                } else {
                    callbackp(error, null);
                }
            })
        },
        propertyUsers: function(callbackp) {
            console.log('Getting property users');
            request('http://platform.biradix.com/seed/propertyUsers?secret=alex', function (error, response, body) {
                console.log('Got property users');
                if (!error && response.statusCode == 200) {

                    var users = JSON.parse(body)
                    callbackp(null,users)
                } else {
                    callbackp(error, null);
                }
            })
        },

    },function(err, all) {
        all.props.forEach(function(p) {
            if (p.company != 'platform') {
                p.orgid = _.find(all.orgs, function (o) {
                    return o.subdomain == p.company
                })._id;
            }
        })

        async.eachLimit(all.props, 1, function(prop, callbackp){
            setTimeout(function() {
                CreateService.create(all.systemUser, context, prop, function (err, newprop) {
                    console.log(prop.name, err)
                    prop._id = newprop._id;
                    callbackp(err, newprop)
                });
            },100);
        }, function(err) {

            async.eachLimit(all.links, 20, function(link, callbackp){
                var subj = _.find(all.props, function(p) {return p.id.toString() == link.subj.toString()});
                if (!subj) {
                    throw Error("Unable to find link subject: " + link.subj.toString())
                }
                var comp = _.find(all.props, function(p) {return p.id.toString() == link.comp.toString()});
                if (!comp) {
                    throw Error("Unable to find link subject: " + link.comp.toString())
                }
                PropertyService.linkComp(all.systemUser,context, null,subj._id, comp._id, function(err, newprop) {
                    callbackp(err, newprop)
                })
            }, function(err) {

                async.eachLimit(all.surveys, 20, function(survey, callbackp){
                    survey.date = new Date(parseInt(survey.date.match(/([0-9])+/g)[0]))
                    survey.community_amenities = _.pluck(_.filter(all.amenities, function(am) { return survey.community_amenities.indexOf(am.name) > -1}),"_id")

                    survey.floorplans.forEach(function(fp) {
                        fp.amenities = _.pluck(_.filter(all.amenities, function(am) { return fp.amenities.indexOf(am.name) > -1}),"_id")
                    })
                    var subj = _.find(all.props, function(p) {return p.id.toString() == survey.propertyid});
                    if (!subj) {
                        throw Error("Unable to find link subject: " + link.subj.toString())
                    }
                    PropertyService.createSurvey(all.systemUser,context, null,subj._id, survey, function(err, newsurvey) {
                        callbackp(err, newsurvey)
                    })
                }, function(err) {

                    all.users.forEach(function(u) {
                        u.date = new Date(parseInt(u.date.match(/([0-9])+/g)[0]));
                        u.emailPassword = false;
                        u.isSystem = false;

                        u.orgid = _.find(all.orgs, function(x) {
                            switch (u.company) {
                                case 2:
                                    return x.subdomain == "alliance";
                                case 3:
                                    return x.subdomain == "wood";
                                case 4:
                                    return x.subdomain == "greystar";
                                case 5:
                                    return x.subdomain == "demo";
                                case 6:
                                    return x.subdomain == "peakliving";
                                case 7:
                                    return x.subdomain == "harbor";
                                default:
                                    throw new Error("Unknown company")
                                    return false;

                            }
                        })._id;

                        u.roleid = _.find(all.roles, function(x) {
                            switch (u.role) {
                                case 2:
                                    return x.tags.indexOf("CM") > -1 && x.orgid.toString() == u.orgid.toString();
                                case 3:
                                    return x.tags.indexOf("RM") > -1 && x.orgid.toString() == u.orgid.toString();
                                case 4:
                                    return x.tags.indexOf("BM") > -1 && x.orgid.toString() == u.orgid.toString();
                                case 5:
                                    return x.tags.indexOf("PO") > -1 && x.orgid.toString() == u.orgid.toString();
                                default:
                                    throw new Error("Unknown role")
                                    return false;
                            }
                        })._id;

                    })

                    //all.users = _.filter(all.users, function(x) {return x.first == 'Blerim'});
                    async.eachLimit(all.users, 1, function(u, callbackp){

                        userCreateService.insert(all.systemUser, context, u, "", function (errors, usr) {
                            if (!errors) {
                                u._id = usr._id;
                            }
                            console.log(u.email, errors);

                            callbackp(null, usr)
                        });
                    }, function(err) {


                        all.propertyUsers.forEach(function(pu) {
                            pu.u = _.find(all.users, function(x) {return x.old == pu.userid})._id;
                            pu.p = _.find(all.props, function(x) {return x.id == pu.propertyid})._id;
                        })

                        var groups = _.groupBy(all.propertyUsers, function(x) {return x.p });

                        for ( var propertyid in groups) {
                            var userids = _.pluck(groups[propertyid],"u");
                            console.log(propertyid, userids);
                            propertyUsersService.setUsersForProperty(all.systemUser,context,null, propertyid, userids, function() {});
                        }

                    });

                    //console.log(all.roles);
                    //console.log(all.orgs);
                });
            });
        });


    });
    reply({success: true});

});

