"use strict";

const async = require("async");
const _ = require("lodash");
const uuid = require("node-uuid");
const PropertyService = require("../services/propertyService");
const PropertyHelperService = require("../services/propertyHelperService");
const AmenitiesService = require("../../amenities/services/amenityService");
const CreateService = require("../services/createService");
const SurveyHelperService = require("../services/surveyHelperService");
const S3Service = require("../../media/services/s3Service");

module.exports = {
    copyImages: function(operator, context, propertyId, media, amenities) {
        PropertyService.search(operator, {limit: 1, permission: "PropertyManage", ids: [propertyId], select: "*"},
            function(err, comps) {
            let property = JSON.parse(JSON.stringify(comps[0]));
            async.eachSeries(media, function(image, callbacks) {
                S3Service.copyImage(image, function(err, newImage) {
                    if (newImage) {
                        property.media.push(newImage);
                    } else {
                        console.error("copyImages error ", err);
                    }
                    callbacks();
                });
            }, function() {
                PropertyHelperService.fixAmenities(property, amenities);
                CreateService.update(operator, context, null, property, {skipGeo: true}, function() {});
            });
        });
    },
    cloneCustom: function(operator, context, property, orgid, callback) {
        let self = this;
        let fpMap = {};
        let newid;
        property.floorplans.forEach(function(fp) {
            newid = uuid.v1();
            fpMap[fp.id] = newid;
            fp.id = newid;
        });

        let newProperty = _.cloneDeep(property);
        newProperty.isCustom = true;

        if (orgid) {
            newProperty.orgid = orgid;
        } else {
            delete newProperty.orgid;
        }
        newProperty.comps = [];
        newProperty.media = [];

        AmenitiesService.search({}, function(err, amenities) {
            PropertyHelperService.fixAmenities(newProperty, amenities);

            CreateService.create(operator, context, newProperty, function(err, newprop) {
                // Give it a seconds for permissions to propogate
                setTimeout(()=> {
                    self.copyImages(operator, context, newprop._id, property.media, amenities);
                }, 1000);

                SurveyHelperService.getAllSurveys(property._id, function(err, surveys) {
                    let newSurvey;
                    async.each(surveys, function(survey, callbacks) {
                        newSurvey = JSON.parse(JSON.stringify(survey));
                        delete newSurvey._id;
                        newSurvey.skipAudit = true;

                        newSurvey.floorplans.forEach(function(fp) {
                            if (fp.id && fpMap[fp.id]) {
                                fp.id = fpMap[fp.id];
                            }
                        });

                        PropertyService.createSurvey(operator, context, null, newprop._id, newSurvey, function(err, created) {
                            callbacks();
                        });
                    }, function() {
                        callback(newprop._id);
                    });
                });
            });
        });
    },
    getClonedComps: function(operator, context, subject, compids, callback) {
        let self = this;
        if (subject.custom && subject.custom.owner) {
            PropertyService.search(operator, {
            limit: 100,
            permission: "PropertyView",
            ids: compids,
            select: "*"}, function(err, comps) {
                let newcompids = [];
                async.eachSeries(compids, function(compid, callbacks) {
                    let comp = _.find(comps, function(x) {
                        return x._id.toString() == compid.toString();
                    });
                    if (comp.custom && comp.custom.owner) {
                        newcompids.push(compid);
                        callbacks();
                    } else {
                        self.cloneCustom(operator, context, comp, null, function(newCompId) {
                            newcompids.push(newCompId);
                            callbacks();
                        });
                    }
                }, function() {
                    return callback(newcompids);
                });
            });
        } else {
            return callback(compids);
        }
    },
};
