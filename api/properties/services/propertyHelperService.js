'use strict';

var fees  = {
    application_fee : 'Application fee',
    lease_terms: 'Lease terms',
    short_term_premium: 'Short term premium',
    refundable_security_deposit: 'Refundable security deposit',
    administrative_fee: 'Administrative fee',
    non_refundable_pet_deposit: 'Non refundable pet deposit',
    pet_deposit: 'Pet deposit',
    pet_rent: 'Pet rent'
}

module.exports = {
    fees: fees,
    floorplanName: function (fp) {
        var name = fp.bedrooms + "x" + fp.bathrooms;

        if (fp.description && fp.description != "") {
            name += " " + fp.description;
        } else {
            name += " - ";
        }

        name += " " + fp.sqft + " Sqft";
        name += ", " + fp.units + " Units";

        return name
    },

    floorplanRentName: function(fp) {
        return "($" + fp.rent + " gmr, $" + fp.concessions + " cons/12)";
    },
    flattenAllCompFloorplans: function(comps, subjectid) {
        var subjcomps = _.find(comps,function(x) {return x._id.toString() == subjectid.toString()}).comps;
        return _.flatten(_.pluck(_.flatten(subjcomps),"floorplans"));
    },
}