var savedReportModel = require("../models/savedReportModel")
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

        var n = new savedReportModel();

        n.name = report.name;
        n.settings = report.settings;
        n.date = new Date();
        n.reportIds = report.reportIds;
        n.ownerid = operator._id;
        n.orgid = null;
        n.type = report.type;

         n.save((err, report) => {

            if (err) {
                modelErrors.push({msg: 'Unexpected Error. Unable to save report.'});
                callback(modelErrors, null);
                return;
            }

            callback(null, report);

        });


    }
}