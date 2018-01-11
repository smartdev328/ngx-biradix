'use strict';
var AuditSchema= require('../schema/auditSchema')
var async = require("async");
var _ = require("lodash")
var moment = require("moment")
var PaginationService = require('../../utilities/services/paginationService')
var DateService = require('../../utilities/services/dateService')
var error = require("../../../config/error");

var audits  = [
    {key: 'login_failed', value: 'Login Failed', group: 'User'},
    {key: 'login_succeeded', value: 'Login Succeeded', group: 'User'},
    {key: 'login_as', value: 'Login As', group: 'User', admin: true},
    {key: 'password_updated', value: 'Password Updated', group: 'User'},
    {key: 'reset_password', value: 'Password Reset', group: 'User'},
    {key: 'user_status', value:  'User Status Updated', undo: true, group: 'User'},
    {key: 'user_notifications', value:  'Notification Settings Updated', undo: false, group: 'User'},
    {key: 'user_reminders', value:  'Reminder Settings Updated', undo: false, group: 'User'},
    {key: 'user_leased', value:  'Leased Settings Updated', undo: false, group: 'User'},
    {key: 'user_atr', value:  'ATR Settings Updated', undo: false, group: 'User'},
    {key: 'user_renewal', value:  'Renewal Settings Updated', undo: false, group: 'User'},
    {key: 'user_concessions', value:  'Detailed Concessions', undo: false, group: 'User'},
    {key: 'user_created', value: 'User Created', group: 'User'},
    {key: 'user_updated', value: 'User Updated', undo: true, group: 'User'},
    {key: 'user_assigned', value: 'User Assigned to Property', undo: true, group: 'User'},
    {key: 'user_unassigned', value: 'User Unassigned from Property', undo: true, group: 'User'},
    {key: 'user_bounced', value: 'User Email Undeliverable', group: 'User'},

    {key: 'property_profile', value: 'Profile Viewed', excludeDefault: true, group: 'Reporting'},
    {key: 'pdf_profile', value: 'PDF Profile', group: 'Reporting'},
    {key: 'print_profile', value: 'Print Profile', group: 'Reporting'},
    {key: 'excel_profile', value: 'Excel Profile', group: 'Reporting'},
    {key: 'report', value: 'Report', group: 'Reporting'},
    {key: 'report_print', value: 'Report Print', group: 'Reporting'},
    {key: 'report_pdf', value: 'Report PDF', group: 'Reporting'},
    {key: 'show_unlinked', value: 'Exclude Setting', group: 'Reporting', admin: true},
    {key: 'report_saved', value: 'New Report Created', group: 'Reporting'},
    {key: 'report_overriden', value: 'Saved Report Replaced', group: 'Reporting'},
    {key: 'report_deleted', value: 'Saved Report Deleted', group: 'Reporting'},
    {key: 'report_updated', value: 'Saved Report Updated', group: 'Reporting'},

    {key: 'property_status', value: 'Updated Property Status', undo: true, group: 'Property'},

    {key: 'comp_linked', value: 'Comp Added', undo: true, group: 'Property'},
    {key: 'comp_unlinked', value: 'Comp Removed', undo: true, group: 'Property'},

    {key: 'property_linked', value: 'Property Added as a Comp', group: 'Property'},
    {key: 'property_unlinked', value: 'Property Removed as a Comp', group: 'Property'},
    {key: 'property_approved', value: 'Property Approved', group: 'Property', admin: true},


    {key: 'links_updated', value: 'Comped Floor Plans Updated', undo: true, group: 'Property'},
    {key: 'property_created', value: 'Property Created', group: 'Property'},
    {key: 'property_profile_updated', value: 'Profile Updated', undo: true, group: 'Property'},
    {key: 'property_contact_updated', value: 'Contact/Notes Updated', undo: true, group: 'Property'},
    {key: 'property_fees_updated', value: 'Fees/Deposits Updated', undo: true, group: 'Property'},
    {key: 'property_amenities_updated', value: 'Amenities Updated', undo: true, group: 'Property'},
    {key: 'property_floorplan_created', value: 'Floor plan Created', undo: true, group: 'Property'},
    {key: 'property_floorplan_removed', value: 'Floor plan Removed', undo: true, group: 'Property'},
    {key: 'property_floorplan_updated', value: 'Floor plan Updated', undo: true, group: 'Property'},
    {key: 'property_floorplan_amenities_updated', value: 'Floor plan Amenities Updated', undo: true, group: 'Property'},

    {key: 'property_pictures', value: 'Pictures Updated', undo: true, group: 'Property'},
    {key: 'property_pictures_order', value: 'Picture order Updated', undo: false, group: 'Property'},


    {key: 'survey_created', value: 'Market Survey Added', undo: true, group: 'Market Survey'},
    {key: 'survey_deleted', value: 'Market Survey Deleted', undo: true, group: 'Market Survey'},
    {key: 'survey_updated', value: 'Market Survey Updated', undo: true, group: 'Market Survey'},
    {key: 'survey_emailed', value: 'Market Survey Swap Emailed', undo: false, group: 'Market Survey'},

    {key: 'amenity_created', value: 'Amenity Created', group: 'Amenity', admin: true},
    {key: 'amenity_updated', value: 'Amenity Updated/Approved', group: 'Amenity', admin: true},
    {key: 'amenity_aliases_updated', value: 'Amenity Aliases Updated', group: 'Amenity', admin: true},
    {key: 'amenity_deleted', value: 'Amenity Deleted', group: 'Amenity', admin: true, undo: true},
    {key: 'amenity_undeleted', value: 'Amenity Undeleted', group: 'Amenity', admin: true, undo: true},
    {key: 'amenity_mapped', value: 'Amenity Mapped as Alias', group: 'Amenity', admin: true, undo: true},
    {key: 'amenity_unmapped', value: 'Amenity Unmapped as Alias', group: 'Amenity', admin: true, undo: true},

    {key: 'tracking_reminder_clicked', value: 'Reminder Email Clicked', group: 'Tracking', admin: true},
    {key: 'tracking_reminder_survey', value: 'Reminder Email Survey', group: 'Tracking', admin: true},

    {key: 'org_default_settings', value: 'Default Settings Updated', group: 'Tracking', admin: true},

];

module.exports = {
    audits: audits,
    create: function(audit,callback) {
        var n = new AuditSchema();

        if (audit.operator) {
            n.operator = {
                id: audit.operator.id || audit.operator._id,
                name: audit.operator.name || (audit.operator.first + ' ' + audit.operator.last)
            }
        }
        if (audit.user) {
            n.user = {
                id: audit.user.id || audit.user._id,
                name: audit.user.name || (audit.user.first + ' ' + audit.user.last)
            };
        }
        if (audit.property) {
            n.property = {
                id: audit.property.id || audit.property._id,
                name: audit.property.name,
                orgid: audit.property.orgid
            };
        }
        if (audit.amenity) {
            n.amenity = {
                id: audit.amenity.id || audit.amenity._id,
                name: audit.amenity.name
            };
        }
        if (audit.data) {
            n.data = audit.data;
        }
        n.context = audit.context;
        n.type = audit.type;
        n.description = audit.description;
        n.adminOnly = audit.adminOnly;
        n.date = new Date().toISOString();

        if (audit.revertedFromId) {
            n.revertedFromId = audit.revertedFromId;
        }

        n.save(callback);
    },
    updateReverted: function (id,callback) {
        var query = {_id: id};
        var update = {reverted: true};
        var options = {new: true};

        AuditSchema.findOneAndUpdate(query, update, options, function(err, saved) {
            return callback(err, saved)
        })
    },
    get: function(criteria, userids, propertyids, compids, callback) {

        var query = QueryBuilder(criteria, userids, propertyids, compids);

        query.count(function(err, obj) {

            if (err) {
                callback(err,[],PaginationService.getPager(criteria.skip, criteria.limit, 0))
            }
            else if (obj == 0) {
                callback(null,[],PaginationService.getPager(criteria.skip, criteria.limit, 0))
            }
            else {
                var query = QueryBuilder(criteria,userids,propertyids,compids).sort("-date").skip(criteria.skip).limit(criteria.limit);
                if (criteria.select) {
                    query = query.select(criteria.select);
                }
                query.exec(function(err, list) {
                    if (userids.length > 0) {
                        list.forEach(function (li) {

                            if (li.operator && li.operator.id && userids.indexOf(li.operator.id.toString()) == -1) {
                                li.operator.name = "External User";
                            }

                            if (li.user && li.user.id && userids.indexOf(li.user.id.toString()) == -1) {
                                li.description = li.description.replace(li.user.name, "External User")
                                li.user.name = "External User";

                            }

                        });
                    }

                    callback(err,list,PaginationService.getPager(criteria.skip, criteria.limit, obj))
                });
            }

        });
    }

}

function QueryBuilder (criteria, userids, propertyids, compids) {
    criteria = criteria || {};

    criteria.skip = criteria.skip || 0;
    criteria.limit = criteria.limit || 50;
    criteria.users = criteria.users || [];
    criteria.properties = criteria.properties || [];

    //Remove "Login As" from non admin so it doesnt cause them to freak out
    if (userids.length > 0 || propertyids.length > 0) {
        if (criteria.types && criteria.types.length > 0) {
            _.remove(criteria.types,function(x) {return x == "login_as" || x == "show_unlinked"});
        }
    }
    var query = AuditSchema.find();

    //Everyone can filter on type
    if (criteria.types && criteria.types.length > 0) {
        query = query.where("type").in(criteria.types);
    }

    //Everyone can filter on daterange
    if (criteria.daterange) {
        var dr = DateService.convertRangeToParts(criteria.daterange,criteria.offset);
        if (criteria.daterange != "Lifetime") {
            query = query.where("date").gte(dr.start).lte(dr.end);
        }
    }

    //Everyone can filter on id
    if (criteria.id) {
        query= query.where("_id").equals(criteria.id);
    }

    var allowedforComps = ['property_created','property_status','property_profile_updated','property_contact_updated','property_fees_updated','property_amenities_updated','property_floorplan_created','property_floorplan_removed','property_floorplan_updated','property_floorplan_amenities_updated','survey_created','survey_deleted','survey_updated'];
    //If you are limited by users or properties go here:
    if (userids.length > 0 || propertyids.length > 0) {

        //default search for non admins, allow them to see all users and props they have access to
        if (criteria.users.length == 0 && criteria.properties.length == 0) {
            query = query.or([
                {"operator.id": {$in : userids}},
                {"user.id": {$in : userids}},
                {"property.id": {$in : propertyids}},
                {$and : [{"property.id": {$in : compids}},{"type":{$in:allowedforComps}}]},
                ])
        }
        else {
            //if we got here that means the non admin is filtering by props or users
            if (criteria.users.length > 0) {
                query = query.or([
                    {"operator.id": {$in : _.intersection(userids, criteria.users)}},
                    {"user.id": {$in : _.intersection(userids, criteria.users)}},
                ])
            }

            if (criteria.properties.length > 0) {
                query = query.or([
                    {"property.id": {$in : _.intersection(propertyids, criteria.properties)}},
                    {$and : [{"property.id": {$in : _.intersection(compids, criteria.properties)}},{"type":{$in:allowedforComps}}]},
                ])
            }

        }
    }
    else {
        //if we got here then we just need to filter for admins
        if (criteria.users.length > 0) {
            query = query.or([
                {"operator.id": {$in : criteria.users}},
                {"user.id": {$in : criteria.users}},
            ])
        }

        if (criteria.properties.length > 0) {
            query = query.and([
                {"property.id": {$in : criteria.properties}},
            ])
        }
    }



    return query;
}