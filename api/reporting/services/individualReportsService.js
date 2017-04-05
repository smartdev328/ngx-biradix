var PropertyService = require('../../properties/services/propertyService')

module.exports = {
    getProperties:  function(user, reports, proeprtyids, callback) {
        var columns = "";
        if (reports.indexOf('community_amenities') > -1) {
            columns += " community_amenities";
        }

        if (reports.indexOf('location_amenities') > -1) {
            columns += " location_amenities";
        }

        if (reports.indexOf('fees_deposits') > -1) {
            columns += " fees";
        }

        if (reports.indexOf('property_rankings') > -1 || reports.indexOf('property_rankings_summary') > -1 || reports.indexOf('market_share') > -1) {
            columns += " survey.id comps.floorplans address";
        }

        PropertyService.search(user, {
            limit: 100,
            permission: 'PropertyView',
            ids: proeprtyids
            ,
            select: "_id name" + columns
        }, function(err, comps, lookups) {
            callback(err,comps,lookups);
        });
    }
}