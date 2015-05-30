var async = require("async");
var UserSchema = require('../api/users/schemas/userSchema')
var AccessService = require('../api/access/services/accessService')
var UserService = require('../api/users/services/userService')
var OrgService = require('../api/organizations/services/organizationService')
var PropertyService = require('../api/properties/services/propertyService')
var AmenityService = require('../api/amenities/services/amenityService')

module.exports = {
    init: function () {
        UserSchema.findOne({},function(err, usr) {
            if (!usr) {
                async.waterfall([
                    function(callbackw) {
                        CompaniesCreate(function(companies) {
                            callbackw(null, companies)
                        })
                    },
                    function(companies,callbackw) {
                        AmenitiesCreate(function(amenities) {
                            callbackw(null, companies)
                        })
                    },
                    function(companies, callbackw) {
                        RolesCreate(companies, function(roles) {
                            callbackw(null,roles, companies)
                        })
                    },
                    function(roles, companies, callbackw){
                        UsersCreate(roles, function(users) {
                            callbackw(null,users, companies, roles)
                        });
                    },
                    function(users, companies,roles, callbackw) {
                        RolesAssignPermissionsCreate(roles, function() {
                            callbackw(null,users, companies, roles)
                        })
                    },
                    function(users, companies, roles, callbackw) {
                        PropertiesCreate(companies,function(properties) {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles, properties, callbackw) {
                        PermissionsCreate(roles, properties, function() {
                            callbackw(null,users, roles, properties)
                        })
                    }
                ], function(err) {

                });
            }
        }) ;

    }
}

var AmenitiesCreate = function(callback) {
    var amenitites = [{"name":"Business Center - Conference Room","type":"Community"},{"name":"Business Center - Free Wi-Fi","type":"Community"},{"name":"Business Center - Laptop Checkout","type":"Community"},{"name":"Business Center - Printers","type":"Community"},{"name":"Clubhouse - Billiards/Pool Table","type":"Community"},{"name":"Clubhouse - Coffee Bar","type":"Community"},{"name":"Clubhouse - Cyber Café","type":"Community"},{"name":"Clubhouse - Game Room","type":"Community"},{"name":"Clubhouse - Gourmet Kitchen","type":"Community"},{"name":"Clubhouse - Movie Theater","type":"Community"},{"name":"Clubhouse - Ping Pong Table","type":"Community"},{"name":"Clubhouse - Rentable Clubhouse","type":"Community"},{"name":"Clubhouse - Rentable DVDs/Movies","type":"Community"},{"name":"Clubhouse - Resident Lounge","type":"Community"},{"name":"Clubhouse - Shuffleboard","type":"Community"},{"name":"Comm Parking - Carport/Covered","type":"Community"},{"name":"Comm Parking - Detached Garage (Add Fee)","type":"Community"},{"name":"Comm Parking - Garage Structure (Free)","type":"Community"},{"name":"Fitness Center - Elliptical","type":"Community"},{"name":"Fitness Center - Free Weights","type":"Community"},{"name":"Fitness Center - Stationary Bicycles","type":"Community"},{"name":"Fitness Center - Treadmills","type":"Community"},{"name":"Landscape - Lush Landscape","type":"Community"},{"name":"Landscape - Mature Landscape","type":"Community"},{"name":"Misc - Air Conditioned Hallways","type":"Community"},{"name":"Misc - Barbecue (BBQ) Grills","type":"Community"},{"name":"Misc - Bike Storage","type":"Community"},{"name":"Misc - Boat Slips","type":"Community"},{"name":"Misc - Car Charging Stations","type":"Community"},{"name":"Misc - Carwash","type":"Community"},{"name":"Misc - Concierge Services","type":"Community"},{"name":"Misc - Elevators","type":"Community"},{"name":"Misc - Guest Parking","type":"Community"},{"name":"Misc - Laundry Drop off/Pick-up","type":"Community"},{"name":"Misc - Laundry Room","type":"Community"},{"name":"Misc - On-Site Storage","type":"Community"},{"name":"Misc - Outdoor Amphitheater","type":"Community"},{"name":"Misc - Outdoor Fireplace","type":"Community"},{"name":"Misc - Playground","type":"Community"},{"name":"Misc - Rooftop Deck","type":"Community"},{"name":"Misc - Storage for Rent","type":"Community"},{"name":"Misc - Surfboard Storage","type":"Community"},{"name":"Misc - Wine Cellar","type":"Community"},{"name":"Misc - Wine Storage Locker (Add. Fee)","type":"Community"},{"name":"Pets - Kennel on Site","type":"Community"},{"name":"Pets - Pet Maintenance Station","type":"Community"},{"name":"Pets - Pet Park","type":"Community"},{"name":"Pool - Diving Pool","type":"Community"},{"name":"Pool - Hammocks","type":"Community"},{"name":"Pool - Heated Pool","type":"Community"},{"name":"Pool - Jaccuzi/Hot Tub/Spa","type":"Community"},{"name":"Pool - Lap Pool","type":"Community"},{"name":"Pool - Large Size Pool","type":"Community"},{"name":"Pool - Lounge","type":"Community"},{"name":"Pool - Luxury Cabanas","type":"Community"},{"name":"Pool - Multiple Pools","type":"Community"},{"name":"Pool - Pool with Slide","type":"Community"},{"name":"Pool - Resort Style","type":"Community"},{"name":"Pool - Salt Water Pool","type":"Community"},{"name":"Pool - Standard Size Pool","type":"Community"},{"name":"Pool - Wi-Fi (Free)","type":"Community"},{"name":"Recreation - Basketball Court","type":"Community"},{"name":"Recreation - Biking Trails","type":"Community"},{"name":"Recreation - Bocce Ball Court","type":"Community"},{"name":"Recreation - Boxing Studio","type":"Community"},{"name":"Recreation - Dance Studio","type":"Community"},{"name":"Recreation - Golf Course","type":"Community"},{"name":"Recreation - Jogging Trails","type":"Community"},{"name":"Recreation - Massage Room","type":"Community"},{"name":"Recreation - Pilate Room","type":"Community"},{"name":"Recreation - Putting Green","type":"Community"},{"name":"Recreation - Racquetball","type":"Community"},{"name":"Recreation - Sand Volleyball Court","type":"Community"},{"name":"Recreation - Sauna","type":"Community"},{"name":"Recreation - Tennis Court","type":"Community"},{"name":"Recreation - Volleyball Court","type":"Community"},{"name":"Recreation - Yoga Room","type":"Community"},{"name":"Security - Controlled Access","type":"Community"},{"name":"Security - Courtesy Patrol","type":"Community"},{"name":"Security - Gated Community","type":"Community"},{"name":"Security - Security Guards","type":"Community"},{"name":"Access to Freeways","type":"Location"},{"name":"Access to Parks","type":"Location"},{"name":"Beach Access","type":"Location"},{"name":"Lake Access","type":"Location"},{"name":"Near Downtown/Employment","type":"Location"},{"name":"Near Golf Course","type":"Location"},{"name":"Near Public Transportation","type":"Location"},{"name":"Near Restaurants \u0026 Bars","type":"Location"},{"name":"Near Retail","type":"Location"},{"name":"Visibility","type":"Location"},{"name":"Walkability","type":"Location"},{"name":"Appliances - Black Appliances","type":"Unit"},{"name":"Appliances - French Door Refrigerator","type":"Unit"},{"name":"Appliances - Gas Stove","type":"Unit"},{"name":"Appliances - Microwave","type":"Unit"},{"name":"Appliances - Refrigerator w/ Water\u0026Ice","type":"Unit"},{"name":"Appliances - Side by Side Refrigerator","type":"Unit"},{"name":"Appliances - Stainless Steel Appliances","type":"Unit"},{"name":"Appliances - Stove Hood","type":"Unit"},{"name":"Appliances - White Appliances","type":"Unit"},{"name":"Bath - Dual Vanity","type":"Unit"},{"name":"Bath - Roman/Garden Tub","type":"Unit"},{"name":"Bath - Separate Shower","type":"Unit"},{"name":"Bath - Steam Shower","type":"Unit"},{"name":"Ceilings - Ceiling Fan","type":"Unit"},{"name":"Ceilings - Crown Molding","type":"Unit"},{"name":"Ceilings - High Ceilings (10ft)","type":"Unit"},{"name":"Ceilings - High Ceilings (10ft+)","type":"Unit"},{"name":"Ceilings - Vaulted Ceilings","type":"Unit"},{"name":"Features - Accent Color Walls","type":"Unit"},{"name":"Features - Air Conditioning","type":"Unit"},{"name":"Features - Backyard","type":"Unit"},{"name":"Features - Balcony","type":"Unit"},{"name":"Features - Built-In Bookshelves","type":"Unit"},{"name":"Features - Computer Desk","type":"Unit"},{"name":"Features - Corner Unit","type":"Unit"},{"name":"Features - Decor Shelving","type":"Unit"},{"name":"Features - Linen Closet","type":"Unit"},{"name":"Features - Patio","type":"Unit"},{"name":"Features - Storage Room","type":"Unit"},{"name":"Features - Two-Inch Blinds","type":"Unit"},{"name":"Features - Venetian Blinds","type":"Unit"},{"name":"Features - Wine Celler","type":"Unit"},{"name":"Features - Wine Cooler","type":"Unit"},{"name":"Features - Wood Blinds","type":"Unit"},{"name":"Fireplace - Gas","type":"Unit"},{"name":"Fireplace - Wood","type":"Unit"},{"name":"Floor Level - First Floor","type":"Unit"},{"name":"Floor Level - Second Floor","type":"Unit"},{"name":"Floor Level - Top Floor","type":"Unit"},{"name":"Flooring - Bamboo","type":"Unit"},{"name":"Flooring - Berber Carpet","type":"Unit"},{"name":"Flooring - Laminate","type":"Unit"},{"name":"Flooring - Tile","type":"Unit"},{"name":"Flooring - Wood Flooring","type":"Unit"},{"name":"Kitchen - Bar Top","type":"Unit"},{"name":"Kitchen - Breakfast Nook","type":"Unit"},{"name":"Kitchen - Dining Room","type":"Unit"},{"name":"Kitchen - Galley Kitchen Style","type":"Unit"},{"name":"Kitchen - Granite Countertops","type":"Unit"},{"name":"Kitchen - Kitchen Island","type":"Unit"},{"name":"Kitchen - Open Kitchen Style","type":"Unit"},{"name":"Kitchen - Pantry","type":"Unit"},{"name":"Kitchen - Quartz Countertops","type":"Unit"},{"name":"Laundry - Dry Cleaning Services","type":"Unit"},{"name":"Laundry - Laundry Room in Unit","type":"Unit"},{"name":"Laundry - Stackable Washer/Dryer","type":"Unit"},{"name":"Laundry - Washer/Dryer Hookup","type":"Unit"},{"name":"Laundry - Washer/Dryer in Unit","type":"Unit"},{"name":"Layout - Den","type":"Unit"},{"name":"Layout - Floor-to-Ceiling Windows","type":"Unit"},{"name":"Layout - Handicap Unit","type":"Unit"},{"name":"Layout - Large Windows","type":"Unit"},{"name":"Layout - Loft Style","type":"Unit"},{"name":"Layout - Open Floor-plan","type":"Unit"},{"name":"Layout - Penthouse","type":"Unit"},{"name":"Layout - Townhome Style","type":"Unit"},{"name":"Parking - Attached Garage (to Unit)","type":"Unit"},{"name":"Parking - Carport (per Unit)","type":"Unit"},{"name":"Parking - Detached Garage (Free)","type":"Unit"},{"name":"Renovated - Upgraded Bath","type":"Unit"},{"name":"Renovated - Upgraded Kitchen","type":"Unit"},{"name":"Security - Alarm System","type":"Unit"},{"name":"Security - Alarm System (Pre-Wired)","type":"Unit"},{"name":"Tech - Cable TV (Avail.)","type":"Unit"},{"name":"Tech - Cable TV (Incl.)","type":"Unit"},{"name":"Tech - Dish/Satellite TV (Avail.)","type":"Unit"},{"name":"Tech - Dish/Satellite TV (Incl.)","type":"Unit"},{"name":"Tech - High Speed Internet (Incl.)","type":"Unit"},{"name":"Tech - Sound System","type":"Unit"},{"name":"Tech - USB Outlets","type":"Unit"},{"name":"Tech - Wireless Internet (Avail.)","type":"Unit"},{"name":"Views - Courtyard View","type":"Unit"},{"name":"Views - Mountain View","type":"Unit"},{"name":"Views - Ocean View","type":"Unit"},{"name":"Views - Pool View","type":"Unit"},{"name":"Views - Skyline/City View","type":"Unit"}];
    async.eachLimit(amenitites, 10, function(amenity, callbackp){
        AmenityService.create(amenity, function (err, am) {
            callbackp(err, am)
        });
    }, function(err) {
        callback();
    });
}
var RolesAssignPermissionsCreate = function(roles, callback) {
    var permissions = [
        {executorid: roles.GreystarCM._id, resource: roles.GreystarCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarPO._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.AllianceCM._id, resource: roles.AllianceCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AllianceRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AllianceRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AlliancePO._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.WoodCM._id, resource: roles.WoodCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodPO._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.DemoCM._id, resource: roles.DemoCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoPO._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},

    ];

    async.eachLimit(permissions, 10, function(permission, callbackp){
        AccessService.createPermission(permission, function (err, perm) {
            callbackp(err, perm)
        });
    }, function(err) {
        callback();
    });


};

var PropertiesCreate = function(companies,callback) {
    var Aurelian = { name: 'Aurelian Apartments', address: '1418 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 632-2596', owner: 'Rome', management: 'Rome', yearBuilt: 2007, orgid: companies.Demo._id, constructionType: 'Garden', notes: 'LRO', fees: {
        application_fee : '$45',
        lease_terms: '6-12 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$150',
        pet_rent: '$25'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: 'Fireplace', units: 96, sqft: 749, amenities: ["Appliances - Stainless Steel Appliances", "Fireplace - Gas", "Kitchen - Granite Countertops"]},
        {bedrooms:1, bathrooms: '1', description: 'Fireplace', units: 22, sqft: 791, amenities: ["Appliances - Stainless Steel Appliances", "Fireplace - Gas", "Kitchen - Granite Countertops"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 60, sqft: 1053, amenities: ["Appliances - Stainless Steel Appliances", "Views - Pool View", "Bath - Dual Vanity", "Kitchen - Granite Countertops"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 88, sqft: 1077, amenities: ["Appliances - Stainless Steel Appliances", "Views - Pool View", "Bath - Dual Vanity", "Kitchen - Granite Countertops"]},
        {bedrooms:3, bathrooms: '2', description: '', units: 48, sqft: 1250, amenities: ["Appliances - Stainless Steel Appliances", "Kitchen - Granite Countertops"]},
    ]
        , community_amenities: ["Business Center - Conference Room", "Business Center - Free Wi-Fi", "Clubhouse - Resident Lounge", "Comm Parking - Carport/Covered", "Comm Parking - Detached Garage (Add Fee)", "Fitness Center - Treadmills", "Misc - Barbecue (BBQ) Grills", "Pool - Heated Pool"]
        , location_amenities: ["Near Retail", "Visibility", "Near Public Transportation"]
    }
    var Augustus = { name: 'Augustus Apartments', address: '7700 E. Roosevelt Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 821-6060', owner: 'Octavian Empire', management: 'Octavian Empire', yearBuilt: 2006, orgid: companies.Demo._id, constructionType: 'Garden', notes: 'Concessions: Complimentary Carpet Cleaning for renewals.\r\n\r\n Notes: Complimentary Carpet Cleaning for renewals', fees: {
        application_fee : '$49',
        lease_terms: '6-13 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$175',
        pet_rent: '$25'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: 'Fireplace', units: 72, sqft: 808, amenities: ["Fireplace - Gas", "Kitchen - Granite Countertops","Appliances - Stainless Steel Appliances", "Appliances - Stove Hood", "Bath - Separate Shower", "Features - Balcony", "Features - Wood Blinds", "Kitchen - Kitchen Island", "Laundry - Washer/Dryer in Unit", "Layout - Open Floor-plan", "Parking - Attached Garage (to Unit)", "Tech - Cable TV (Avail.)", "Tech - Wireless Internet (Avail.)"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 36, sqft: 935, amenities: ["Appliances-Stainless Steel Appliances", "Ceilings - Vaulted Ceilings", "Kitchen - Granite Countertops", "Bath - Dual Vanity", "Bath - Separate Shower", "Ceilings - Ceiling Fan", "Features - Air Conditioning", "Features - Balcony", "Features - Storage Room", "Features - Wood Blinds", "Flooring - Wood Flooring", "Kitchen - Kitchen Island", "Laundry - Washer/Dryer in Unit", "Layout - Open Floor-plan", "Parking - Carport (per Unit)", "Tech - Cable TV (Avail.)", "Tech - Wireless Internet (Avail.)", "Views - Pool View"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 36, sqft: 982, amenities: ["Appliances - Stainless Steel Appliances", "Bath - Dual Vanity", "Bath - Roman/Garden Tub", "Ceilings - Ceiling Fan", "Features - Air Conditioning", "Features - Balcony", "Features - Wood Blinds", "Fireplace - Gas", "Flooring - Wood Flooring", "Kitchen - Kitchen Island", "Laundry - Washer/Dryer in Unit", "Parking - Carport (per Unit)", "Tech - Cable TV (Avail.)", "Views - Courtyard View"]},
        {bedrooms:1, bathrooms: '1', description: 'Den', units: 60, sqft: 1058, amenities: ["Appliances-Stainless Steel Appliances", "Ceilings - Vaulted Ceilings", "Kitchen - Granite Countertops", "Fireplace - Gas", "Bath - Roman/Garden Tub", "Bath - Separate Shower", "Ceilings - Ceiling Fan", "Features - Air Conditioning", "Features - Balcony", "Features - Wood Blinds", "Flooring - Wood Flooring", "Kitchen - Kitchen Island", "Laundry - Washer/Dryer in Unit", "Layout - Den", "Layout - Large Windows", "Tech - Cable TV (Avail.)", "Views - Pool View"]},
        {bedrooms:2, bathrooms: '1', description: '', units: 88, sqft: 1040, amenities: ["Appliances-Stainless Steel Appliances", "Kitchen - Granite Countertops", "Appliances - Microwave", "Bath - Roman/Garden Tub", "Ceilings - Ceiling Fan", "Features - Air Conditioning", "Features - Balcony", "Features - Built-In Bookshelves", "Features - Storage Room", "Features - Wood Blinds", "Fireplace - Gas", "Flooring - Wood Flooring", "Kitchen - Kitchen Island", "Kitchen - Pantry", "Layout - Open Floor-plan", "Parking - Carport (per Unit)", "Tech - Cable TV (Avail.)"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 48, sqft: 1151, amenities: ["Appliances - Stainless Steel Appliances", "Bath - Dual Vanity", "Bath - Roman/Garden Tub", "Bath - Separate Shower", "Ceilings - Ceiling Fan", "Features - Air Conditioning", "Features - Balcony", "Features - Computer Desk", "Features - Wood Blinds", "Fireplace - Gas", "Flooring - Wood Flooring", "Kitchen - Kitchen Island", "Laundry - Washer/Dryer in Unit", "Layout - Open Floor-plan", "Parking - Carport (per Unit)", "Security - Alarm System (Pre-Wired)", "Tech - Cable TV (Avail.)", "Tech - Wireless Internet (Avail.)", "Views - Pool View"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 48, sqft: 1171, amenities: ["Appliances - Stainless Steel Appliances", "Bath - Dual Vanity", "Bath - Roman/Garden Tub", "Ceilings - Vaulted Ceilings", "Features - Balcony", "Features - Decor Shelving", "Features - Storage Room", "Features - Wood Blinds", "Flooring - Wood Flooring", "Kitchen - Breakfast Nook", "Kitchen - Kitchen Island", "Laundry - Washer/Dryer in Unit", "Parking - Detached Garage (Free)", "Tech - Cable TV (Avail.)", "Views - Courtyard View"]},
        {bedrooms:3, bathrooms: '2', description: '', units: 12, sqft: 1414, amenities: ["Appliances-Stainless Steel Appliances", "Kitchen - Granite Countertops", "Fireplace - Gas", "Bath - Roman/Garden Tub", "Ceilings - Ceiling Fan", "Features - Air Conditioning", "Features - Balcony", "Features - Computer Desk", "Features - Wood Blinds", "Flooring - Wood Flooring", "Laundry - Laundry Room in Unit", "Laundry - Washer/Dryer in Unit", "Layout - Open Floor-plan", "Parking - Carport (per Unit)", "Tech - Cable TV (Avail.)"]},
    ]
        , community_amenities: ["Business Center - Free Wi-Fi", "Clubhouse - Resident Lounge", "Comm Parking - Carport/Covered", "Comm Parking - Detached Garage (Add Fee)", "Fitness Center - Treadmills", "Misc - Barbecue (BBQ) Grills", "Misc - Concierge Services", "Pool - Heated Pool"]
        , location_amenities: ["Near Retail", "Visibility", "Access to Parks"]
    }
    var Nero = { name: 'Nero Palace', address: '2500 N. Hayden Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 782-6699', owner: 'Nero Residential Capital', management: 'Nero Residential', yearBuilt: 2006, constructionType: 'Garden', notes: 'Concessions: Complimentary Carpet Cleaning for renewals.\r\n\r\n Notes: Deposit $500 or $87.50, Application $50, Admin $150', fees: {
        application_fee : '50',
        lease_terms: '6-13 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$175',
        pet_rent: '$25'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 60, sqft: 719, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 24, sqft: 827, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 36, sqft: 851, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:1, bathrooms: '1', description: 'Den', units: 24, sqft: 975, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:2, bathrooms: '1', description: '', units: 30, sqft: 970, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 30, sqft: 1060, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 48, sqft: 1085, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
        {bedrooms:3, bathrooms: '2', description: '', units: 12, sqft: 1322, amenities: ["Kitchen - Granite Countertops", "Tech - Sound System", "Appliances - Stainless Steel Appliances", "Flooring - Wood Flooring"]},
    ]
        , community_amenities: ["Business Center - Conference Room", "Business Center - Free Wi-Fi", "Clubhouse - Resident Lounge", "Comm Parking - Carport/Covered", "Comm Parking - Detached Garage (Add Fee)", "Fitness Center - Treadmills", "Misc - Barbecue (BBQ) Grills", "Misc - Concierge Services", "Pool - Heated Pool", "Misc - Outdoor Fireplace"]
        , location_amenities: ["Near Retail", "Visibility", "Access to Parks"]
    }
    var Marcus = { name: 'Marcus Aurelius Place', address: '7800 E. McDowell Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 786-3323', owner: 'Roman Residential Services', management: 'Roman Residential Services', yearBuilt: 2006, orgid: companies.Greystar._id, constructionType: 'Garden', notes: 'Owners Of Community Refuse to provied Occupancy and Traffic Information', fees: {
        application_fee : '$40',
        lease_terms: '6-14 months',
        short_term_premium: 'no short term leases, but have 20 corp suites',
        refundable_security_deposit: '$99',
        administrative_fee: '$75',
        non_refundable_pet_deposit: '$200',
        pet_deposit: '$200',
        pet_rent: '$15'
    }, floorplans: [
        {bedrooms:0, bathrooms: '1', description: '', units: 12, sqft: 649, amenities: ["Fireplace - Wood"]},
        {bedrooms:0, bathrooms: '1', description: '', units: 12, sqft: 661, amenities: ["Fireplace - Wood"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 120, sqft: 880, amenities: []},
        {bedrooms:2, bathrooms: '2', description: '', units: 70, sqft: 1150, amenities: ["Fireplace - Wood"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 70, sqft: 1187, amenities: []},
    ]
        , community_amenities: ["Security - Controlled Access", "Business Center - Free Wi-Fi", "Clubhouse - Resident Lounge", "Comm Parking - Carport/Covered", "Comm Parking - Detached Garage (Add Fee)", "Fitness Center - Treadmills", "Misc - Barbecue (BBQ) Grills", "Clubhouse - Movie Theater", "Pool - Heated Pool", "Clubhouse - Billiards/Pool Table"]
        , location_amenities: ["Near Retail", "Near Golf Course", "Access to Parks"]
    }
    var Geta = { name: 'Geta Residential', address: '3500 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 840-6655', owner: 'Colosseum Capital', management: 'Colosseum Properties', yearBuilt: 2006, orgid: companies.Greystar._id, constructionType: 'Garden', notes:'Concessions: $500 Off Move-In on a 12 month lease. Comments: Deposit wavied OAC', fees: {
        application_fee : '$50',
            lease_terms: '6-14 months',
            short_term_premium: '$300',
            refundable_security_deposit: '$150-$250',
            administrative_fee: '$150',
            non_refundable_pet_deposit: '$152',
            pet_deposit: '$300',
            pet_rent: '$25'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 156, sqft: 854, amenities: ["Appliances - Black Appliances", "Features - Two Inch Blinds", "Flooring - Laminate", "Kitchen - Granite Countertops", "Tech - Sound System"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 120, sqft: 1215, amenities: ["Appliances - Black Appliances", "Features - Two Inch Blinds", "Flooring - Laminate", "Kitchen - Granite Countertops", "Tech - Sound System"]},
        {bedrooms:3, bathrooms: '3', description: '', units: 36, sqft: 1394, amenities: ["Appliances - Black Appliances", "Features - Two Inch Blinds", "Flooring - Laminate", "Kitchen - Granite Countertops", "Tech - Sound System"]},
    ]
        , community_amenities: ["Business Center - Conference Room", "Security - Controlled Access", "Business Center - Free Wi-Fi", "Clubhouse - Resident Lounge", "Comm Parking - Carport/Covered", "Fitness Center - Treadmills", "Misc - Barbecue (BBQ) Grills", "Recreation - Volleyball Court", "Pool - Heated Pool", "Clubhouse - Billiards/Pool Table", "Clubhouse - Rentable DVDs/Movies"]
        , location_amenities: ["Near Retail", "Visibility", "Access to Parks"]
    }
    var Titus = { name: 'Titus Place', address: '7700 E. Osborn St.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 276-4310', owner: 'Titus Investments', management: 'Titus Investments', yearBuilt: 2007, constructionType: 'Garden', notes: 'LRO', fees: {
        application_fee : '$50',
        lease_terms: '6-12 months',
        short_term_premium: 'no short terms',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$175',
        pet_deposit: '$175',
        pet_rent: '$25'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 56, sqft: 745, amenities: ["Appliances - Black Appliances", "Flooring - Tile"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 24, sqft: 820, amenities: ["Appliances - Black Appliances", "Flooring - Tile"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 16, sqft: 955, amenities: ["Appliances - Black Appliances", "Flooring - Tile"]},
        {bedrooms:1, bathrooms: '1', description: 'Den', units: 24, sqft: 970, amenities: ["Appliances - Black Appliances", "Flooring - Tile", "Layout - Den"]},
        {bedrooms:2, bathrooms: '1', description: '', units: 28, sqft: 1025, amenities: ["Appliances - Black Appliances", "Flooring - Tile"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 28, sqft: 1085, amenities: ["Appliances - Black Appliances", "Flooring - Tile", "Features - Patio"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 44, sqft: 1135, amenities: ["Appliances - Black Appliances", "Flooring - Tile", "Features - Patio"]},
        {bedrooms:3, bathrooms: '2', description: '', units: 12, sqft: 1355, amenities: ["Appliances - Black Appliances", "Flooring - Tile"]},
    ]
        , community_amenities: ["Business Center - Conference Room","Business Center - Free Wi-Fi","Clubhouse - Resident Lounge","Comm Parking - Carport/Covered","Comm Parking - Detached Garage (Add Fee)","Fitness Center - Treadmills","Misc - Barbecue (BBQ) Grills","Pool - Heated Pool"]
        , location_amenities: ["Near Retail", "Visibility", "Access to Parks"]
    }
    var Probus = { name: 'Probus Properties', address: '7800 E. Camelback Rd.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 457-8787', owner: 'Rome', management: 'Rome', yearBuilt: 2007, constructionType: 'Garden', notes: 'Comments: Deposit: $95 non-refundable fee OR $135 non-refundable fee plus $200 refundable.', fees: {
        application_fee : '$45',
        lease_terms: '2-12 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$150',
        pet_rent: '$25'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 48, sqft: 745, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 24, sqft: 820, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:1, bathrooms: '1', description: '', units: 16, sqft: 955, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:1, bathrooms: '1.5', description: 'Den', units: 24, sqft: 970, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:2, bathrooms: '1', description: '', units: 20, sqft: 1025, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 20, sqft: 1085, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:2, bathrooms: '2', description: '', units: 36, sqft: 1135, amenities: ["Kitchen - Granite Countertops"]},
        {bedrooms:3, bathrooms: '2', description: '', units: 8, sqft: 1355, amenities: ["Kitchen - Granite Countertops"]},
    ]
        , community_amenities: ["Business Center - Free Wi-Fi", "Misc - Barbecue (BBQ) Grills", "Misc - Playground", "Pool - Jaccuzi/Hot Tub/Spa", "Pool - Heated Pool"]
        , location_amenities: ["Near Retail", "Visibility", "Access to Parks"]
    }

    async.parallel({
            Aurelian: function (callbackp) {
                PropertyService.create(Aurelian, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Augustus: function (callbackp) {
                PropertyService.create(Augustus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Nero: function (callbackp) {
                PropertyService.create(Nero, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Marcus: function (callbackp) {
                PropertyService.create(Marcus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Geta: function (callbackp) {
                PropertyService.create(Geta, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Titus: function (callbackp) {
                PropertyService.create(Titus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Probus: function (callbackp) {
                PropertyService.create(Probus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            }
        },function(err, props) {
            var links = [];
            for (var prop in props) {
                for (var prop2 in props) {
                    if (props[prop]._id.toString() != props[prop2]._id.toString() ) {
                        links.push({subjectid: props[prop]._id, compid: props[prop2]._id})
                    }
                }

            }

            async.eachLimit(links, 10, function(link, callbackp){
                PropertyService.linkComp(link.subjectid, link.compid, function (err, l) {
                    callbackp(err, l)
                });
            }, function(err) {
                callback(props)
            });


        }
    );


}
var UsersCreate = function(roles, callback) {

    var System = {email : "admin@biradix.com", password: "$%%##FSDFSD", first : "System", last : "User", isSystem : true, roleid: roles.BiradixAdmin._id};
    var Eugene = {email : "eugene@biradix.com", password: "BIradix11!!", first : "Eugene", last : "K", roleid: roles.BiradixAdmin._id};
    var Blerim = {email : "blerim@biradix.com", password: "BIradix11!!", first : "Blerim", last : "Z", roleid: roles.BiradixAdmin._id};
    var Alex = {email : "alex@biradix.com", password: "BIradix11!!", first : "Alex", last : "V", roleid: roles.BiradixAdmin._id};
    var Michelle = {email : "mbetchner@greystar.com", password: "Betchner321", first : "Michelle", last : "Betchner", roleid: roles.GreystarCM._id};


    async.parallel({
            System: function(callbackp) {
                UserService.insert(System, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Alex: function(callbackp) {
                UserService.insert(Alex, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Eugene: function(callbackp) {
                UserService.insert(Eugene, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Blerim: function(callbackp) {
                UserService.insert(Blerim, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Michelle: function(callbackp) {
                UserService.insert(Michelle, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            }
        },function(err, users) {
            callback(users)
        }
    );


}

var RolesCreate = function(Orgs, callback) {
    var BiradixAdmin = {name: "Site Admin", isadmin: true, tags: ['Admin'], orgid : Orgs.Biradix._id}
    var AllianceCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Alliance._id}
    var AllianceRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Alliance._id}
    var AllianceBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Alliance._id}
    var AlliancePO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Alliance._id}
    var DemoCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Demo._id}
    var DemoRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Demo._id}
    var DemoBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Demo._id}
    var DemoPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Demo._id}
    var WoodCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Wood._id}
    var WoodRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Wood._id}
    var WoodBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Wood._id}
    var WoodPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Wood._id}
    var GreystarCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Greystar._id}
    var GreystarRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Greystar._id}
    var GreystarBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Greystar._id}
    var GreystarPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Greystar._id}

    async.parallel({
        BiradixAdmin: function(callbackp) {
            AccessService.createRole(BiradixAdmin, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceCM: function(callbackp) {
            AccessService.createRole(AllianceCM, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceRM: function(callbackp) {
            AccessService.createRole(AllianceRM, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceBM: function(callbackp) {
            AccessService.createRole(AllianceBM, function(err, role){
                callbackp(null, role)
            });
        },
        AlliancePO: function(callbackp) {
            AccessService.createRole(AlliancePO, function(err, role){
                callbackp(null, role)
            });
        },
        DemoCM: function(callbackp) {
            AccessService.createRole(DemoCM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoRM: function(callbackp) {
            AccessService.createRole(DemoRM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoBM: function(callbackp) {
            AccessService.createRole(DemoBM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoPO: function(callbackp) {
            AccessService.createRole(DemoPO, function(err, role){
                callbackp(null, role)
            });
        },
        WoodCM: function(callbackp) {
            AccessService.createRole(WoodCM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodRM: function(callbackp) {
            AccessService.createRole(WoodRM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodBM: function(callbackp) {
            AccessService.createRole(WoodBM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodPO: function(callbackp) {
            AccessService.createRole(WoodPO, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarCM: function(callbackp) {
            AccessService.createRole(GreystarCM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarRM: function(callbackp) {
            AccessService.createRole(GreystarRM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarBM: function(callbackp) {
            AccessService.createRole(GreystarBM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarPO: function(callbackp) {
            AccessService.createRole(GreystarPO, function(err, role){
                callbackp(null, role)
            });
        }
},function(err, roles) {callback(roles)})


}

var CompaniesCreate = function(callback) {
    var Biradix = {name: "BI:Radix", subdomain: 'platform', logoBig: 'biradix.png', logoSmall: 'biradix-small.png', isDefault : true}
    var Demo = {name: "Demo Residential", subdomain: 'demo', logoBig: 'demo.png', logoSmall: 'demo-small.png'}
    var Greystar = {name: "Greystar", subdomain: 'greystar', logoBig: 'greystar.jpg', logoSmall: 'greystar-small.png'}
    var Wood = {name: "Wood Residential", subdomain: 'wood', logoBig: 'wood.png', logoSmall: 'wood-small.png'}
    var Alliance = {name: "Alliance Residential", subdomain: 'alliance', logoBig: 'alliance.png', logoSmall: 'alliance-small.png'}


    async.parallel({
        Biradix: function(callbackp)
    {
        OrgService.create(Biradix, function (err, org) {
            callbackp(err, org)
        });
    }
    ,
        Alliance: function (callbackp) {
        OrgService.create(Alliance, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Demo: function (callbackp) {
        OrgService.create(Demo, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Wood: function (callbackp) {
        OrgService.create(Wood, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Greystar: function (callbackp) {
        OrgService.create(Greystar, function (err, org) {
            callbackp(err, org)
        });
    }


},function(err, orgs) {
        if (err) {
            throw Error(err);

        }
        callback(orgs)
    })


}

var PermissionsCreate = function(roles, properties, callback) {

    var permissions = [
        {executorid: roles.BiradixAdmin._id, resource: "Users/LogInAs", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/Create", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Org/Assign", allow: true, type: 'Execute'},

        {executorid: roles.GreystarCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.AllianceCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.WoodCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.DemoCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Properties", allow: true, type: 'Execute'},
    ];

    async.eachLimit(permissions, 10, function(permission, callbackp){
        AccessService.createPermission(permission, function (err, perm) {
            callbackp(err, perm)
        });
    }, function(err) {
        callback();
    });




}

