'use strict';
var express = require('express');
var Routes = express.Router();
var saveReportService = require('../services/saveReportService')
/////////////////////

Routes.get('/', (req,res) => {
    saveReportService.read(req.user, (errors, reports) => {
        res.status(200).json({errors : errors, reports: reports});
    })
})

Routes.post('/upsert', (req,res) => {
    saveReportService.upsert( req.user, req.context, req.body, (errors, report, existing) => {
        res.status(200).json({errors : errors, report: report, existing: existing});
    })
});


module.exports = Routes;