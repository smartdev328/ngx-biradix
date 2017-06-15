var savedReportModel = require("../models/savedReportModel")
var auditService = require('../../audit/services/auditService')

module.exports = {
    read: (operator,callback) => {
        var query = savedReportModel.find({ownerid: operator._id});
        query.exec(callback);
    },
    remove: (operator, context, reportId, callback) => {
        var modelErrors = [];

        savedReportModel.findOne({ownerid: operator._id, _id: reportId}, (err, existing) => {
            if (!existing) {
                modelErrors.push({param: 'name', msg : 'Unable to find report to delete.'});
                return callback(modelErrors);
            }

            savedReportModel.remove({_id: reportId}, err => {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to delete report.'});
                    callback(modelErrors);
                    return;
                }

                auditService.create({user: operator, operator: operator,type: 'report_deleted', description: existing.name, context: context, adminOnly: existing})
                callback(null);
            })
        })
    },
    update: (operator, context, report, callback) => {
        var modelErrors = [];

        savedReportModel.findOne({ownerid: operator._id, _id: report._id}, (err, existing) => {
            if (!existing) {
                modelErrors.push({param: 'name', msg : 'Unable to find report to update.'});
                return callback(modelErrors, null);
            }

            savedReportModel.findOne({ownerid: operator._id, name: new RegExp('^'+report.name+'$', "i")}, (err, dupe) => {

                if (dupe && dupe._id.toString() != report._id.toString()) {
                    modelErrors.push({param: 'name', msg : 'A report with the same name already exists. Please use a unique name.'});
                    return callback(modelErrors, null);
                }

                var bChanged = false;
                var oldname = "";
                if (existing.name != report.name) {
                    bChanged = true;
                    oldname = existing.name;
                }

                existing.name = report.name;

                existing.save((err, report) => {

                    if (err) {
                        modelErrors.push({msg: 'Unexpected Error. Unable to save report.'});
                        callback(modelErrors, null);
                        return;
                    }

                    if (bChanged) {

                        auditService.create({
                            user: operator,
                            operator: operator,
                            type: 'report_updated',
                            description: oldname + " => " + report.name,
                            context: context
                        })
                    }

                    callback(null, report);

                });

            });

        })
    },
    upsert: (operator, context, report, callback) => {

        var modelErrors = [];

        if ((report.name || '') == '')
        {
            modelErrors.push({param: 'name', msg : 'Please provide the name of this report'});
            return callback(modelErrors, null);
        }

        savedReportModel.findOne({ownerid: operator._id, name: new RegExp('^'+report.name+'$', "i")}, (err, existing) => {

            if (existing && !report.override) {
                return callback(null, null, true);
            }

            var n = existing;

            if (!existing) {
               n = new savedReportModel();
            }

            n.name = report.name;
            n.settings = report.settings;
            n.date = new Date();
            n.reportIds = report.reportIds;
            n.ownerid = operator._id;
            n.orgid = null;
            n.type = report.type;

            data = report.reportNames;

            n.save((err, report) => {

                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to save report.'});
                    callback(modelErrors, null);
                    return;
                }

                auditService.create({user: operator, operator: operator,type: existing ? 'report_overriden' : 'report_saved', description: report.name, context: context, adminOnly: report, data: data})

                callback(null, report);

            });
        });


    }
}