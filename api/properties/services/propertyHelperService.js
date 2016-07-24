'use strict';

var _ = require("lodash");

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

        if (typeof fp.concessionsOneTime != 'undefined') {
            return "($" + fp.rent + " gmr, $" + fp.concessions + " cons/total, $" + fp.concessionsOneTime + " cons/one-time, $" + fp.concessionsOneTime + " cons/monthly)";
        }
        else {
            return "($" + fp.rent + " gmr, $" + fp.concessions + " cons/total)";
        }

    },
    flattenAllCompFloorplans: function(comps, subjectid) {
        var subjcomps = _.find(comps,function(x) {return x._id.toString() == subjectid.toString()}).comps;
        return _.flatten(_.pluck(_.flatten(subjcomps),"floorplans"));
    },
    fixAmenities: function(property, amenities) {
        var o = property.community_amenities.map(function(x) {return x.toString()})
        var a = _.pluck(_.filter(amenities, function (x) {
            return o.indexOf(x._id.toString()) > -1
        }), "name");

        property.community_amenities = a;

        o = property.location_amenities.map(function(x) {return x.toString()})
        a = _.pluck(_.filter(amenities, function (x) {
            return o.indexOf(x._id.toString()) > -1
        }), "name");

        property.location_amenities = a;

        property.floorplans.forEach(function(fp) {
            o = fp.amenities.map(function(x) {return x.toString()})
            a = _.pluck(_.filter(amenities, function (x) {
                return o.indexOf(x._id.toString()) > -1
            }), "name");

            fp.amenities = a;
        })

    }
}