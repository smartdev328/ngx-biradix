var queues = require("../config/queues")
//var _ = require('lodash');
//var async = require("async");
//var request = require('request')
//var OrgService = require('../api/organizations/services/organizationService')
//var PropertyService = require('../api/properties/services/propertyService')
//var CreateService = require('../api/properties/services/createService')
//var AmenityService = require('../api/amenities/services/amenityService')

queues.getImportQueue().consume(function(data,reply) {
    reply({success: true});
    //async.parallel({
    //    props: function(callbackp) {
    //        request('http://platform.biradix.com/seed/props?secret=alex', function (error, response, body) {
    //            if (!error && response.statusCode == 200) {
    //
    //                var props = JSON.parse(body)
    //                callbackp(null,props)
    //            } else {
    //                callbackp(error, null);
    //            }
    //        })
    //    },
    //    orgs: function(callbackp) {
    //        OrgService.read(function (err, orgs) {
    //            callbackp(null, orgs)
    //        });
    //    },
    //    links: function(callbackp) {
    //        request('http://platform.biradix.com/seed/comps?secret=alex', function (error, response, body) {
    //            if (!error && response.statusCode == 200) {
    //
    //                var links = JSON.parse(body)
    //                callbackp(null,links)
    //            } else {
    //                callbackp(error, null);
    //            }
    //        })
    //    },
    //    surveys: function(callbackp) {
    //        request('http://platform.biradix.com/seed/surveys?secret=alex', function (error, response, body) {
    //            if (!error && response.statusCode == 200) {
    //
    //                var surveys = JSON.parse(body)
    //                callbackp(null,surveys)
    //            } else {
    //                callbackp(error, null);
    //            }
    //        })
    //    },
    //    amenities: function(callbackp) {
    //        var time = new Date();
    //        AmenityService.search(function (err, amenities) {
    //            callbackp(err, amenities)
    //        })
    //    }
    //},function(err, all) {
    //    all.props.forEach(function(p) {
    //        if (p.company != 'platform') {
    //            p.orgid = _.find(all.orgs, function (o) {
    //                return o.subdomain == p.company
    //            })._id;
    //        }
    //    })
    //
    //    async.eachLimit(all.props, 20, function(prop, callbackp){
    //        console.log(prop.name);
    //        CreateService.create(prop, function (err, newprop) {
    //            prop._id = newprop._id;
    //            callbackp(err, newprop)
    //        });
    //    }, function(err) {
    //
    //        async.eachLimit(all.links, 20, function(link, callbackp){
    //            var subj = _.find(all.props, function(p) {return p.id.toString() == link.subj.toString()});
    //            if (!subj) {
    //                throw Error("Unable to find link subject: " + link.subj.toString())
    //            }
    //            var comp = _.find(all.props, function(p) {return p.id.toString() == link.comp.toString()});
    //            if (!comp) {
    //                throw Error("Unable to find link subject: " + link.comp.toString())
    //            }
    //            PropertyService.linkComp(subj._id, comp._id, function(err, newprop) {
    //                callbackp(err, newprop)
    //            })
    //        }, function(err) {
    //
    //            async.eachLimit(all.surveys, 20, function(survey, callbackp){
    //                survey.date = new Date(parseInt(survey.date.match(/([0-9])+/g)[0]))
    //                survey.community_amenities = _.pluck(_.filter(all.amenities, function(am) { return survey.community_amenities.indexOf(am.name) > -1}),"_id")
    //
    //                survey.floorplans.forEach(function(fp) {
    //                    fp.amenities = _.pluck(_.filter(all.amenities, function(am) { return fp.amenities.indexOf(am.name) > -1}),"_id")
    //                })
    //                var subj = _.find(all.props, function(p) {return p.id.toString() == survey.propertyid});
    //                if (!subj) {
    //                    throw Error("Unable to find link subject: " + link.subj.toString())
    //                }
    //                PropertyService.createSurvey(subj._id, survey, function(err, newsurvey) {
    //                    callbackp(err, newsurvey)
    //                })
    //            }, function(err) {
    //
    //                reply({success: true});
    //            });
    //        });
    //    });
    //
    //
    //});
    //

});

