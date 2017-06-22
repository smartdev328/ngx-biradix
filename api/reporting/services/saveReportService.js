var savedReportModel = require("../models/savedReportModel")
var auditService = require('../../audit/services/auditService')
var userService = require('../../users/services/userService')

module.exports = {
    read: (operator,callback) => {
        read(operator, callback);
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


            let dupeQuery = {ownerid: operator._id, name: new RegExp('^'+report.name+'$', "i")};

            if (existing.orgid) {
                dupeQuery = {orgid: existing.orgid, name: new RegExp('^'+report.name+'$', "i")};
            }


            savedReportModel.findOne(dupeQuery, (err, dupe) => {

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

                    read(operator,(error, reports) => {
                        let newReport = reports.filter(x=>x._id== report._id)[0];

                        callback(null, newReport);
                    })



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

        let dupeQuery = {ownerid: operator._id, name: new RegExp('^'+report.name+'$', "i")};

        if (report.share === true) {
            dupeQuery = {orgid: operator.orgs[0]._id, name: new RegExp('^'+report.name+'$', "i")};
        }

        savedReportModel.findOne(dupeQuery, (err, existing) => {

            if (existing && report.share && existing.ownerid.toString() != operator._id.toString() && operator.roles['0'] != 'Corporate Admin' && operator.roles['0'] != 'Site Admin') {
                modelErrors.push({param: 'name', msg : 'A shared report with this name already exists in your organization. Unable to update shared report.'});
                return callback(modelErrors, null);
            }

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
            n.orgid = report.share === true ? operator.orgs[0]._id : null;
            n.type = report.type;

            data = report.reportNames;

            if (n.orgid) {
                data.push({description: 'Shared with Organization'})
            }

            n.save((err, report) => {

                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to save report.'});
                    callback(modelErrors, null);
                    return;
                }

                auditService.create({user: operator, operator: operator,type: existing ? 'report_overriden' : 'report_saved', description: report.name, context: context, adminOnly: report, data: data})

                read(operator,(error, reports) => {
                    let newReport = reports.filter(x=>x._id== report._id)[0];

                    callback(null, newReport);
                })

            });
        });


    }
}

function read(operator, callback) {
    var query = savedReportModel.find({$or: [{ownerid: operator._id}, {orgid : operator.orgs[0]._id}]});
    query.exec((err, reports) => {

        reports = JSON.parse(JSON.stringify(reports));

        var sharedUserIds = [];

        reports.forEach(report => {
            if (report.orgid) {
                sharedUserIds.push(report.ownerid);
            }
        })

        if (!sharedUserIds.length) {
            callback(err, reports);
        } else {
            userService.getSystemUser(System => {
                let SystemUser = System.user;
                let user;

                userService.search(SystemUser, {ids: sharedUserIds}, (usererrors, users) => {

                    reports.forEach(report => {
                        if (report.orgid) {
                            user = users.filter(x=> x._id == report.ownerid);

                            if (user && user.length) {
                                report.owner = users[0].name;
                            }
                        }
                    })

                    callback(err, reports);
                })

            });
        }

    });
}