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

Routes.post('/update', (req,res) => {
    saveReportService.update( req.user, req.context, req.body, (errors, report) => {
        res.status(200).json({errors : errors, report: report});
    })
});


Routes.delete('/:reportId', (req,res) => {
    saveReportService.remove( req.user, req.context, req.params.reportId, (errors) => {
        res.status(200).json({errors : errors});
    })
});



module.exports = Routes;