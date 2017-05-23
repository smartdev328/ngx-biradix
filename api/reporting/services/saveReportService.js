var savedReportModel = require("../models/savedReportModel")
var auditService = require('../../audit/services/auditService')

module.exports = {
    read: (operator,callback) => {
        var query = savedReportModel.find({ownerid: operator._id});
        query.exec(callback);
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