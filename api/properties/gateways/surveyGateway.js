var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var surveyHelperService = require('../services/surveyHelperService')
var moment = require('moment');
var async = require('async');
var _ = require("lodash")

module.exports = {
    init: function(Routes) {

        Routes.get('/:id/survey/guests/:guestid/email', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                surveyHelperService.emailGuest(req.user, req.context, req.basePath, req.params.id, req.params.guestid, function (errs) {
                    return res.status(200).json({errors: errs});
                });
            });
        });

        Routes.post('/:id/survey/warnings', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }


                async.parallel(
                    {
                        twoWeeks: function(callbackp) {
                            var end = moment().add(-7,"day");
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
                        },
                        recent: function(callbackp) {
                            var end = moment().add(1,"day");
                            var start = moment(end).add(-13,"day")
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
                        //console.log(all)

                        var errors = [];

                        if (all.recent) {
                            var o = all.recent;
                            var n = req.body;

                            var percent;

                            if (n.occupancy) {
                                percent = Math.abs((parseFloat(n.occupancy) - parseFloat(o.occupancy)) / parseFloat(n.occupancy) * 100);

                                if (percent >= 10) {
                                    errors.push({msg: 'Occupancy % has changed by more than 10% since last survey'});
                                }
                            }

                            if (n.leased && o.leased != null && o.leased != '' && typeof o.leased != 'undefined') {
                                percent = Math.abs((parseFloat(n.leased || 0) - parseFloat(o.leased || 0)) / parseFloat(n.leased) * 100);

                                if (percent >= 10) {
                                    errors.push({msg: 'Leased % has changed by more than 10% since last survey'});
                                }
                            }

                            var fpNer =false;
                            n.floorplans.forEach(function(fp) {
                                var old = _.find(o.floorplans, function(x) {return x.id.toString() == fp.id.toString() });

                                if (old && old.rent) {
                                    var oldNer = old.rent - old.concessions / 12;
                                    var newNer = fp.rent - fp.concessions / 12;
                                    percent = Math.abs((parseInt(newNer) - parseInt(oldNer)) / parseInt(oldNer) * 100);
                                    if (percent >= 10) {
                                        fpNer = true;
                                    }

                                }
                            })

                            if (fpNer === true) {
                                errors.push({msg:'Rent pricing for some floor plans has changed by more than 10% since last survey'});
                            }
                        }


                        if (all.twoWeeks) {
                            var o = all.twoWeeks;
                            var n = req.body;

                            if (parseFloat(o.occupancy) === parseFloat(n.occupancy)) {
                                errors.push({msg:'Occupancy % has not changed in two weeks'});
                            }

                            if (parseFloat(o.weeklytraffic) === parseFloat(n.weeklytraffic)) {
                                errors.push({msg:'Traffic/Week has not changed in two weeks'});
                            }

                        }

                        if (all.oneMonth) {
                            var o = all.oneMonth;
                            var n = req.body;

                            if (parseFloat(o.weeklyleases) === parseFloat(n.weeklyleases)) {
                                errors.push({msg:'Leases/Week has not changed in a month'});
                            }


                            var fpNer = false;
                            var fpNerAll = true;
                            n.floorplans.forEach(function(fp) {
                                var old = _.find(o.floorplans, function(x) {return x.id.toString() == fp.id.toString() });

                                if (old && old.rent) {
                                    var oldNer = old.rent - old.concessions / 12;
                                    var newNer = fp.rent - fp.concessions / 12;
                                    if (parseInt(newNer) == parseInt(oldNer)) {
                                        fpNer = true;
                                    } else {
                                        fpNerAll = false;
                                    }
                                }
                            })

                            if (fpNerAll === true) {
                                errors.push({msg:'<B style="color:#f33">Rents for all floor plans have not changed in a month</B>'});
                            } else if (fpNer) {
                                //errors.push({msg:'Rent pricing for some floor plans has not changed in one month'});
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