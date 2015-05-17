'use strict';

var express = require('express');
var ProgressService = require('../services/progressService')

var Routes = express.Router();

Routes.get('/:progressId', function (req, res) {
    ProgressService.isComplete(req.params.progressId, function(progressId) {
        res.status(200).json({progressId: progressId})
    })

});

module.exports = Routes;