var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')

module.exports = {
    init: function(Routes) {
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