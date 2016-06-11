var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var surveyHelperService = require('../services/surveyHelperService')
var moment = require('moment');
var async = require('async');

module.exports = {
    init: function(Routes) {

        Routes.post('/:id/survey/warnings', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }


                async.parallel(
                    {
                        twoWeeks: function(callbackp) {
                            var end = moment().add(-3,"day");
                            var start = moment(end).add(-14,"day")
                            surveyHelperService.getSurveyBeforeDate(req.params.id,start,end, function(err, surveys) {

                                if (surveys.length == 1) {
                                    surveys = surveys[0];
                                } else {
                                    surveys = null;
                                }
                                callbackp(null,surveys);
                            })
                        },
                        oneMonth: function(callbackp) {
                            var end = moment().add(-24,"day");
                            var start = moment(end).add(-40,"day")
                            surveyHelperService.getSurveyBeforeDate(req.params.id,start,end, function(err, surveys) {
                                if (surveys.length == 1) {
                                    surveys = surveys[0];
                                } else {
                                    surveys = null;
                                }
                                callbackp(null,surveys);
                            })
                        }
                    },function(err,all) {
                        console.log(all)

                        var errors = [];
                        if (all.twoWeeks) {
                            var o = all.twoWeeks;
                            var n = req.body;

                            if (parseFloat(o.occupancy) === parseFloat(n.occupancy)) {
                                errors.push({msg:'Occupancy % has not changed in two weeks'});
                            }

                            if (parseFloat(o.weeklytraffic) === parseFloat(n.weeklytraffic)) {
                                errors.push({msg:'Traffic has not changed in two weeks'});
                            }

                            if (parseFloat(o.weeklyleases) === parseFloat(n.weeklyleases)) {
                                errors.push({msg:'Leases has not changed in two weeks'});
                            }

                        }

                        return res.status(200).json({success: errors.length > 0, errors: errors});
                })



            })
        })

        Routes.post('/:id/survey', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.createSurvey(req.user, req.context, null,req.params.id, req.body, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })

        Routes.put('/:id/survey/:surveyid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.updateSurvey(req.user, req.context, null,req.params.id,req.params.surveyid, req.body, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })

        Routes.get('/:id/survey/:surveyid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.getSurvey({ids: [req.params.surveyid]}, function (err, survey) {
                    if (err) {
                        return res.status(400).json({errors: err});
                    }
                    else {
                        return res.status(200).json({survey: survey});
                    }
                });
            })
        })

        Routes.get('/:id/surveys', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.getSurvey({propertyid: req.params.id, select: "date"}, function (err, survey) {
                    if (err) {
                        return res.status(400).json({errors: err});
                    }
                    else {
                        return res.status(200).json({survey: survey});
                    }
                });
            })
        })
    }
}