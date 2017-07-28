var async = require("async");
var moment = require("moment");
var settings = require("./settings");
var UserSchema = require('../api/users/schemas/userSchema')
var AccessService = require('../api/access/services/accessService')
var UserCreateService = require('../api/users/services/userCreateService')
var UserService = require('../api/users/services/userService')
var OrgService = require('../api/organizations/services/organizationService')
var PropertyService = require('../api/properties/services/propertyService')
var propertyUsersService = require('../api/propertyusers/services/propertyUsersService')
var CreateService = require('../api/properties/services/createService')
var AmenityService = require('../api/amenities/services/amenityService')

var context = {ip: '127.0.0.1', user_agent: 'server'}

module.exports = {
    init: function () {
        UserSchema.findOne({},function(err, usr) {
            if (usr) {
                console.log('No seed');
                // OrgService.hydrateOrgRoles();
            } else {
                async.waterfall([
                    function(callbackw) {
                        CompaniesCreate(function(companies) {
                            console.log('Companies Seeded');
                            callbackw(null, companies)
                        })
                    },
                    function(companies, callbackw) {
                        RolesCreate(companies, function(roles) {
                            console.log('Roles Seeded');
                            callbackw(null,roles, companies)
                        })
                    },
                    function(roles, companies, callbackw){
                        UsersCreate(roles, function(users) {
                            console.log('Users Seeded');
                            callbackw(null,users, companies, roles)
                        });
                    },
                    function(users, companies, roles,callbackw) {
                        AmenitiesCreate(users.System, function(amenities) {
                            callbackw(null, users, companies, roles)
                        })
                    },

                    function(users, companies,roles, callbackw) {
                        RolesAssignPermissionsCreate(roles, function() {
                            callbackw(null,users, companies, roles)
                        })
                    },
                    function(users, companies, roles, callbackw) {
                        if (!settings.SEED_DEMO) {
                            return callbackw(null,users, roles, null)
                        }

                        PropertiesCreate(users.System, companies,function(properties) {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles, properties, callbackw) {
                        PermissionsCreate(roles, function() {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles, properties, callbackw) {
                        if (!settings.SEED_DEMO) {
                            return callbackw(null,users, roles, properties)
                        }

                        SurveysCreate(users, properties, function() {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles, properties, callbackw) {
                        if (!settings.SEED_TEST) {
                            return callbackw(null,users, roles, properties)
                        }

                        AssignProperties(users, properties, function() {
                            callbackw(null,users, roles, properties)
                        })
                    }
                ], function(err) {

                });
            }
        }) ;

    }
}

var SurveysCreate = function(users, properties, callback) {
    var date = moment().subtract(1,"year").add(1,"day");

    async.series([
        //point 0 for test properties
        function(callbacks){
            var surveys = [];

            var dateTemp = moment().subtract(1,"year").add(1,"day").subtract(1,"week");

            var rents = [ 1000, 1000, 2000, 2000, 3000, 3000, 4000, 4000 ];
            surveys.push(getSurvey(dateTemp, properties.Test1, 90, 10, 10, rents));

            rents = [ 1500, 0, 3000, 0 ];
            surveys.push(getSurvey(dateTemp, properties.Test2, 90, 10, 10, rents));

            rents = [ 4000, 500, 500, 8000, 1000, 1000 ];
            surveys.push(getSurveyRecurring(dateTemp, properties.Test3, 90, 10, 10, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 1
        function(callbacks){
            var surveys = [];

            var rents = [ 760, 0, 860, 0, 1030, 0, 1065, 0, 1245, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,96.1, 53, 17, rents));

            rents = [ 800, 762, 824, 784, 850, 817, 926, 926, 937, 937, 948, 948, 992, 992, 1350, 670 ];
            surveys.push(getSurvey(date, properties.Augustus, 93, 63, 25, rents));

            rents = [ 820, 701, 845, 721, 950, 831, 1032, 741, 992, 912, 1046, 962, 926, 851, 1275, 1173 ];
            surveys.push(getSurvey(date, properties.Nero, 96, 32, 18, rents));

            rents = [ 645, 0, 645, 0, 738, 0, 980, 0, 1034, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 92, 43, 22, rents));

            rents = [ 650, 0, 925, 0, 986, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 93, 99, 16, rents));

            rents = [  675, 0, 715, 0, 795, 0, 805, 0, 970, 0, 1056, 0, 1197, 0, 1075, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 93.9, 65, 14, rents));

            rents = [  815, 0, 830, 0, 904, 0, 1043, 0, 987, 0, 1103, 0, 1206, 0, 1300, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 97, 51, 12, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 2
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 865, 0, 965, 0, 1060, 0, 1097, 0, 1276, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,95.2, 56, 18, rents));

            rents = [ 840, 772, 855, 786, 870, 800, 937, 862, 910, 837, 950, 874, 930, 855, 1320, 700 ];
            surveys.push(getSurvey(date, properties.Augustus, 92.4, 55, 21, rents));

            rents = [ 848, 780, 875, 805, 975, 897, 1040, 956, 981, 902, 1060, 975, 978, 899, 1199, 1103 ];
            surveys.push(getSurvey(date, properties.Nero, 92.3, 35, 24, rents));

            rents = [ 651, 0, 651, 0, 745, 0, 998, 0, 1002, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 93, 45, 25, rents));

            rents = [ 675, 0, 900, 0, 1023, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 91, 58, 24, rents));

            rents = [  670, 0, 719, 0, 800, 0, 827, 0, 950, 0, 975, 0, 990, 0, 1099, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 94, 57, 22, rents));

            rents = [  823, 0, 854, 0, 937, 0, 1074, 0, 970, 0, 1004, 0, 1102, 0, 1250, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 96.2, 57, 22, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 3
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 865, 0, 965, 0, 1020, 0, 1055, 0, 1200, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,94.2, 59, 19, rents));

            rents = [ 856, 787, 872, 802, 887, 816, 955, 878, 890, 818, 920, 846, 948, 872, 1346, 750 ];
            surveys.push(getSurvey(date, properties.Augustus, 93.1, 58, 22, rents));

            rents = [ 864, 794, 892, 820, 994, 914, 1060, 975, 1000, 920, 1081, 994, 997, 917, 1222, 1124 ];
            surveys.push(getSurvey(date, properties.Nero, 93.1, 38, 25, rents));

            rents = [ 657, 0, 657, 0, 752, 0, 1017, 0, 1012, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 92, 48, 26, rents));

            rents = [ 681, 0, 909, 0, 1033, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 90, 61, 25, rents));

            rents = [  650, 0, 700, 0, 808, 0, 843, 0, 899, 0, 915, 0, 970, 0, 1109, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 93.4, 60, 23, rents));

            rents = [  831, 0, 862, 0, 946, 0, 1095, 0, 979, 0, 1024, 0, 1113, 0, 1210, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 95, 60, 23, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 4
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 874, 0, 975, 0, 1031, 0, 1066, 0, 1212, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,93.2, 51, 15, rents));

            rents = [ 873, 742, 889, 755, 904, 768, 974, 827, 865, 735, 938, 797, 923, 784, 1372, 1166 ];
            surveys.push(getSurvey(date, properties.Augustus, 93.1, 50, 18, rents));

            rents = [ 881, 748, 909, 772, 1013, 861, 1081, 918, 912, 775, 1001, 850, 967, 821, 1246, 1059 ];
            surveys.push(getSurvey(date, properties.Nero, 91.0, 30, 21, rents));

            rents = [ 664, 0, 664, 0, 760, 0, 1028, 0, 1023, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 91, 40, 22, rents));

            rents = [ 688, 0, 919, 0, 1044, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 89, 53, 21, rents));

            rents = [  657, 0, 707, 0, 817, 0, 852, 0, 880, 0, 897, 0, 965, 0, 1120, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 92.4, 52, 19, rents));

            rents = [  840, 0, 871, 0, 956, 0, 1106, 0, 989, 0, 1044, 0, 1124, 0, 1198, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 91.5, 52, 19, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 5
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 901, 0, 1005, 0, 1075, 0, 1105, 0, 1249, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,92.2, 43, 11, rents));

            rents = [ 890, 756, 906, 770, 922, 783, 993, 844, 882, 749, 956, 812, 941, 799, 1399, 1189 ];
            surveys.push(getSurvey(date, properties.Augustus, 94.1, 42, 14, rents));

            rents = [ 898, 763, 927, 787, 1033, 878, 1102, 936, 930, 790, 1021, 867, 986, 838, 1270, 1397 ];
            surveys.push(getSurvey(date, properties.Nero, 89.5, 22, 17, rents));

            rents = [ 684, 0, 684, 0, 783, 0, 1059, 0, 1054, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 90, 32, 18, rents));

            rents = [ 709, 0, 947, 0, 1076, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 88, 45, 17, rents));

            rents = [ 677, 0, 729, 0, 842, 0, 878, 0, 870, 0, 880, 0, 940, 0, 1131, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 92, 44, 15, rents));

            rents = [ 866, 0, 898, 0, 985, 0, 1140, 0, 1090, 0, 1156, 0, 1245, 0, 1209, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 90.1, 44, 15, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 6
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 929, 0, 1036, 0, 1108, 0, 1139, 0, 1287, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,94.2, 43, 11, rents));

            rents = [ 890, 623, 906, 634, 922, 645, 993, 695, 882, 617, 956, 669, 941, 658, 1399, 979 ];
            surveys.push(getSurvey(date, properties.Augustus, 92.6, 45, 17, rents));

            rents = [ 898, 628, 927, 648, 1033, 723, 1102, 771, 930, 651, 1021, 714, 986, 690, 1270, 889 ];
            surveys.push(getSurvey(date, properties.Nero, 91.5, 25, 20, rents));

            rents = [ 705, 0, 705, 0, 776, 0, 1091, 0, 1086, 0 ];
            surveys.push(getSurvey(date, properties.Marcus,  92, 35, 21, rents));

            rents = [ 731, 0, 976, 0, 1066, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 91, 48, 20, rents));

            rents = [ 720, 0, 775, 0, 876, 0, 1002, 0, 833, 0, 865, 0, 912, 0, 1142, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 94.5, 47, 18, rents));

            rents = [ 892, 0, 925, 0, 976, 0, 1175, 0, 1123, 0, 1179, 0, 1257, 0, 1221, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 92.1, 47, 18, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 7
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 911, 0, 1016, 0, 1157, 0, 1167, 0, 1262, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,96.2, 49, 17, rents));

            rents = [ 890, 534, 906, 543, 922, 553, 993, 595, 882, 529, 956, 573, 941, 564, 1399, 839 ];
            surveys.push(getSurvey(date, properties.Augustus, 94.6, 48, 20, rents));

            rents = [ 898, 538, 927, 556, 1033, 619, 1102, 661, 930, 558, 1021, 714, 986, 591, 1143, 685 ];
            surveys.push(getSurvey(date, properties.Nero, 93.5, 28, 23, rents));

            rents = [ 691, 0, 691, 0, 761, 0, 1070, 0, 1065, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 94, 38, 24, rents));

            rents = [ 717, 0, 957, 0, 1045, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 93, 51, 23, rents));

            rents = [ 706, 0, 760, 0, 859, 0, 982, 0, 817, 0, 882, 0, 884, 0, 1119, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 92.5, 50, 21, rents));

            rents = [ 875, 0, 907, 0, 957, 0, 1152, 0, 1101, 0, 1202, 0, 1219, 0, 1257, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 90.1, 50, 21, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 8
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 893, 0, 996, 0, 1198, 0, 1234, 0, 1237, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,94.7, 52, 20, rents));

            rents = [ 898, 538, 915, 732, 931, 558, 973, 973, 890, 534, 927, 556, 950, 570, 1343, 1141 ];
            surveys.push(getSurvey(date, properties.Augustus, 95.6, 51, 23, rents));

            rents = [ 906, 543, 936, 748, 1043, 625, 1212, 1212, 939, 563, 990, 594, 995, 597, 1097, 932 ];
            surveys.push(getSurvey(date, properties.Nero, 94.5, 31, 26, rents));

            rents = [ 678, 0, 678, 0, 746, 0, 1049, 0, 1044, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 95, 41, 27, rents));

            rents = [ 703, 0, 938, 0, 1025, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 94, 54, 26, rents));

            rents = [ 692, 0, 745, 0, 842, 0, 963, 0, 801, 0, 899, 0, 857, 0, 1096, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 93.5, 53, 24, rents));

            rents = [ 858, 0, 889, 0, 938, 0, 1129, 0, 1079, 0, 1226, 0, 1182, 0, 1230, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 91.6, 53, 24, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 9
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 920, 0, 1026, 0, 1234, 0, 1272, 0, 1275, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,92.6, 55, 23, rents));

            rents = [ 906, 543, 924, 739, 940, 564, 953, 953, 898, 538, 899, 539, 959, 575, 1289, 1095 ];
            surveys.push(getSurvey(date, properties.Augustus, 93.6, 54, 26, rents));

            rents = [ 915, 549, 945, 756, 1053, 631, 1187, 1187, 948, 568, 960, 576, 1004, 602, 1053, 895 ];
            surveys.push(getSurvey(date, properties.Nero, 92.5, 34, 29, rents));

            rents = [ 699, 0, 712, 0, 769, 0, 1081, 0, 1076, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 92.4, 44, 30, rents));

            rents = [ 725, 0, 985, 0, 1056, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 92, 57, 29, rents));

            rents = [ 713, 0, 783, 0, 868, 0, 992, 0, 826, 0, 916, 0, 865, 0, 1106, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 91.5, 56, 27, rents));

            rents = [ 884, 0, 934, 0, 967, 0, 1163, 0, 1112, 0, 1250, 0, 1193, 0, 1242, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 91, 56, 27, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 10
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 948, 0, 1057, 0, 1272, 0, 1311, 0, 1357, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,93.5, 60, 26, rents));

            rents = [ 915, 549, 933, 746, 949, 569, 981, 981, 940, 564, 960, 576, 978, 586, 1301, 1105 ];
            surveys.push(getSurvey(date, properties.Augustus, 94.2, 59, 29, rents));

            rents = [ 924, 554, 954, 763, 1063, 637, 1222, 1222, 957, 574, 979, 587, 1014, 608, 1063, 903 ];
            surveys.push(getSurvey(date, properties.Nero, 92.5, 39, 32, rents));

            rents = [ 720, 0, 727, 0, 793, 0, 1114, 0, 1109, 0 ];
            surveys.push(getSurvey(date, properties.Marcus,  93.5, 49, 33, rents));

            rents = [ 747, 0, 1005, 0, 1088, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 94.2, 62, 32, rents));

            rents = [ 770, 0, 819, 0, 940, 0, 1050, 0, 851, 0, 934, 0, 873, 0, 1117, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 92, 61, 30, rents));

            rents = [ 911, 0, 953, 0, 997, 0, 1198, 0, 1146, 0, 1275, 0, 1204, 0, 1297, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 92, 61, 30, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 11
        function(callbacks){
            var surveys = [];
            date = date.add(1,"month");

            var rents = [ 977, 0, 1089, 0, 1272, 0, 1311, 0, 1357, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,94.3, 65, 29, rents));

            rents = [ 924, 554, 942, 753, 958, 574, 1010, 1010, 967, 580, 1014, 608, 1067, 640, 1314, 1116 ];
            surveys.push(getSurvey(date, properties.Augustus, 95, 64, 32, rents));

            rents = [ 933, 559, 963, 770, 1052, 631, 1258, 1258, 966, 579, 998, 598, 1034, 620, 1073, 912 ];
            surveys.push(getSurvey(date, properties.Nero, 92.5, 44, 35, rents));

            rents = [ 742, 0, 727, 0, 793, 0, 1114, 0, 1109, 0 ];
            surveys.push(getSurvey(date, properties.Marcus,  94.7, 54, 36, rents));

            rents = [ 770, 0, 1005, 0, 1088, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 94.2, 67, 35, rents));

            rents = [ 830, 0, 870, 0, 998, 0, 1090, 0, 890, 0, 998, 0, 1023, 0, 1128, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 94, 66, 33, rents));

            rents = [ 950, 0, 975, 0, 997, 0, 1198, 0, 1146, 0, 1300, 0, 1216, 0, 1325, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 93.5, 66, 33, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 12
        function(callbacks){
            var surveys = [];
            date = date.add(15,"day");

            var rents = [ 977, 0, 1100, 0, 1285, 0, 1325, 0, 1412, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,95.6, 70, 32, rents));

            rents = [ 877, 526, 951, 760, 948, 568, 1040, 884, 976, 585, 1050, 630, 1101, 660, 1327, 663 ];
            surveys.push(getSurvey(date, properties.Augustus, 96.5, 69, 35, rents));

            rents = [ 886, 531, 972, 777, 1041, 624, 1295, 1100, 927, 556, 1017, 610, 982, 589, 1083, 541 ];
            surveys.push(getSurvey(date, properties.Nero, 93.5, 49, 38, rents));

            rents = [ 742, 0, 735, 0, 801, 0, 1126, 0, 1154, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 95.7, 59, 39, rents));

            rents = [ 770, 0, 1016, 0, 1099, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 96.3, 72, 38, rents));

            rents = [ 830, 0, 879, 0, 1008, 0, 1101, 0, 945, 0, 998, 0, 1067, 0, 1105, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 95, 71, 36, rents));

            rents = [ 950, 0, 985, 0, 1007, 0, 1210, 0, 1192, 0, 1261, 0, 1240, 0, 1350, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 93, 71, 36, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 13
        function(callbacks){
            var surveys = [];
            date = date.add(15,"day");

            var rents = [ 997, 0, 1122, 0, 1311, 0, 1352, 0, 1441, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,96.6, 75, 35, rents));

            rents = [ 833, 499, 960, 768, 938, 562, 1071, 910, 936, 561, 1071, 642, 1045, 627, 1340, 670 ];
            surveys.push(getSurvey(date, properties.Augustus, 94.7, 74, 38, rents));

            rents = [ 841, 504, 981, 784, 1030, 618, 1333, 1133, 889, 533, 1006, 603, 932, 559, 1093, 546 ];
            surveys.push(getSurvey(date, properties.Nero, 94.5, 54, 41, rents));

            rents = [ 757, 0, 750, 0, 818, 0, 1149, 0, 1143, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 96.7, 64, 42, rents));

            rents = [ 800, 0, 1090, 0, 1250, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 95.4, 77, 41, rents));

            rents = [ 847, 0, 897, 0, 1029, 0, 1124, 0, 967, 0, 1003, 0, 1070, 0, 1082, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 96, 76, 39, rents));

            rents = [ 969, 0, 1005, 0, 1028, 0, 1235, 0, 1181, 0, 1198, 0, 1230, 0, 1323, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 93, 76, 39, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 14
        function(callbacks){
            var surveys = [];
            date = date.add(7,"day");

            var rents = [ 988, 0, 1145, 0, 1204, 0, 1250, 0, 1470, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,94.6, 67, 27, rents));

            rents = [ 849, 509, 969, 775, 928, 556, 1060, 901, 890, 534, 990, 594, 1076, 645, 1340, 670 ];
            surveys.push(getSurvey(date, properties.Augustus, 92.7, 66, 30, rents));

            rents = [ 857, 514, 990, 792, 1019, 611, 1319, 1121, 906, 543, 1006, 603, 959, 575, 1093, 546 ];
            surveys.push(getSurvey(date, properties.Nero, 92.5, 46, 33, rents));

            rents = [ 750, 0, 735, 0, 835, 0, 1172, 0, 1143, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 92.1, 56, 34, rents));

            rents = [ 830, 0, 1143, 0, 1238, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 93.4, 69, 33, rents));

            rents = [ 790, 0, 850, 0, 900, 0, 976, 0, 830, 0, 896, 0, 997, 0, 1060, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 95, 68, 31, rents));

            rents = [ 900, 0, 910, 0, 1049, 0, 1260, 0, 1181, 0, 1204, 0, 1260, 0, 1276, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 94, 68, 31, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 15
        function(callbacks){
            var surveys = [];
            date = date.add(7,"day");

            var rents = [ 998, 0, 1157, 0, 1178, 0, 1201, 0, 1456, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,93.2, 59, 19, rents));

            rents = [ 865, 519, 978, 782, 918, 550, 1049, 891, 868, 520, 945, 567, 1020, 612, 1340, 670 ];
            surveys.push(getSurvey(date, properties.Augustus, 90.7, 58, 22, rents));

            rents = [ 874, 524, 999, 799, 1008, 604, 1305, 1109, 924, 554, 1006, 603, 987, 592, 1093, 546 ];
            surveys.push(getSurvey(date, properties.Nero, 90.5, 38, 25, rents));

            rents = [ 728, 0, 743, 0, 844, 0, 1184, 0, 1132, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 90.2, 48, 26, rents));

            rents = [ 750, 0, 1130, 0, 1251, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 93.4, 61, 25, rents));

            rents = [ 800, 0, 846, 0, 909, 0, 986, 0, 801, 0, 820, 0, 978, 0, 1038, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 92, 60, 23, rents));

            rents = [ 873, 0, 920, 0, 1060, 0, 1273, 0, 1170, 0, 1167, 0, 1285, 0, 1250, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 94, 60, 23, rents));

            rents = [ 750, 750, 1500, 1500, 2500, 2500, 2700, 2700 ];
            surveys.push(getSurvey(date, properties.Test1, 90, 10, 10, rents));

            rents = [ 1000, 0, 2000, 1000 ];
            surveys.push(getSurvey(date, properties.Test2, 90, 10, 10, rents));

            rents = [ 3000, 1000, 1000, 6000, 1000, 2000 ];
            surveys.push(getSurveyRecurring(date, properties.Test3, 90, 10, 10, rents));


            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 16
        function(callbacks){
            var surveys = [];
            date = date.add(7,"day");

            var rents = [ 1008, 0, 1169, 0, 1150, 0, 1176, 0, 1442, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,93.7, 51, 11, rents));

            rents = [ 882, 529, 987, 789, 908, 544, 1038, 882, 885, 531, 945, 567, 1050, 630, 1340, 1139 ];
            surveys.push(getSurvey(date, properties.Augustus, 92.6, 50, 14, rents));

            rents = [ 891, 534, 1008, 806, 997, 598, 1291, 1097, 970, 582, 1045, 627, 1036, 621, 1093, 929 ];
            surveys.push(getSurvey(date, properties.Nero, 91.5, 30, 17, rents));

            rents = [ 736, 0, 751, 0, 853, 0, 1150, 0, 1097, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 88.2, 40, 18, rents));

            rents = [ 720, 0, 1099, 0, 1264, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 91, 53, 17, rents));

            rents = [ 723, 0, 900, 0, 870, 0, 920, 0, 793, 0, 795, 0, 967, 0, 1040, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 90, 52, 15, rents));

            rents = [ 950, 0, 1013, 0, 1150, 0, 1301, 0, 1159, 0, 1131, 0, 1310, 0, 1225, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 92, 52, 15, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        },
        //point 17
        function(callbacks){
            var surveys = [];
            date = date.add(7,"day");

            var rents = [ 1019, 0, 1181, 0, 1196, 0, 1133, 0, 1428, 0 ];
            surveys.push(getSurvey(date, properties.Aurelian,92.5, 43, 3, rents));

            rents = [ 899, 764, 996, 846, 898, 538, 1027, 872, 902, 541, 945, 567, 1081, 648, 1340, 1072 ];
            surveys.push(getSurvey(date, properties.Augustus, 92.4, 42, 6, rents));

            rents = [ 908, 771, 1018, 865, 987, 592, 1278, 1086, 989, 593, 1045, 627, 1067, 853, 1093, 1093 ];
            surveys.push(getSurvey(date, properties.Nero, 91, 22, 9, rents));

            rents = [ 744, 0, 759, 0, 862, 0, 1145, 0, 1087, 0 ];
            surveys.push(getSurvey(date, properties.Marcus, 91.2, 32, 10, rents));

            rents = [ 700, 0, 1089, 0, 1277, 0 ];
            surveys.push(getSurvey(date, properties.Geta, 92.5, 45, 9, rents));

            rents = [ 731, 0, 909, 0, 879, 0, 930, 0, 786, 0, 771, 0, 986, 0, 1065, 0 ];
            surveys.push(getSurvey(date, properties.Titus, 87, 44, 7, rents));

            rents = [ 970, 0, 1010, 0, 1164, 0, 1315, 0, 1148, 0, 1097, 0, 1336, 0, 1200, 0 ];
            surveys.push(getSurvey(date, properties.Probus, 93, 44, 7, rents));

            rents = [ 500, 1000, 1000, 1000, 2000, 2000, 2200, 2000 ];
            surveys.push(getSurvey(date, properties.Test1, 90, 10, 10, rents));

            rents = [ 500, 0, 1000, 1000 ];
            surveys.push(getSurvey(date, properties.Test2, 90, 10, 10, rents));

            rents = [ 2000, 400, 200, 4000, 400, 400 ];
            surveys.push(getSurveyRecurring(date, properties.Test3, 90, 10, 10, rents));

            insertPoints(users.System, surveys, function() {
                callbacks(null);
            })
        }
    ], function() {
        callback();
    });

}

var insertPoints = function(System, surveys, callback) {
    async.eachLimit(surveys, 10, function(survey, callbackp){
        PropertyService.createSurvey(System, context, null, survey.propertyid, survey, function (err) {
            callbackp(err)
        });
    }, function(err) {
        callback();
    });
}

var getSurveyRecurring = function(date, property, occupancy, weeklytraffic, weeklyleases, rents) {
    rents.forEach(function(r, i) {

        if (i % 3 == 0) {
            property.floorplans[i / 3].rent = rents[i];
            property.floorplans[i / 3].concessionsOneTime = rents[i + 1];
            property.floorplans[i / 3].concessionsMonthly = rents[i + 2];

        }
    })

    return {
        date: date.format(),
        propertyid:property._id,
        occupancy: occupancy,
        weeklytraffic : weeklytraffic,
        weeklyleases: weeklyleases,
        floorplans: property.floorplans

    };
}

var getSurvey = function(date, property, occupancy, weeklytraffic, weeklyleases, rents) {
    rents.forEach(function(r, i) {

        if (i % 2 == 0) {
            property.floorplans[i / 2].rent = rents[i];
            property.floorplans[i / 2].concessions = rents[i + 1];
        }
    })

    return {
        date: date.format(),
        propertyid:property._id,
        occupancy: occupancy,
        weeklytraffic : weeklytraffic,
        weeklyleases: weeklyleases,
        floorplans: property.floorplans

    };
}

var AmenitiesCreate = function(System, callback) {
    var amenitites = [{"name":"Business Center - Conference Room","type":"Community"},{"name":"Business Center - Free Wi-Fi","type":"Community"},{"name":"Business Center - Laptop Checkout","type":"Community"},{"name":"Business Center - Printers","type":"Community"},{"name":"Clubhouse - Billiards/Pool Table","type":"Community"},{"name":"Clubhouse - Coffee Bar","type":"Community"},{"name":"Clubhouse - Cyber Cafe","type":"Community"},{"name":"Clubhouse - Game Room","type":"Community"},{"name":"Clubhouse - Gourmet Kitchen","type":"Community"},{"name":"Clubhouse - Movie Theater","type":"Community"},{"name":"Clubhouse - Ping Pong Table","type":"Community"},{"name":"Clubhouse - Rentable Clubhouse","type":"Community"},{"name":"Clubhouse - Rentable DVDs/Movies","type":"Community"},{"name":"Clubhouse - Resident Lounge","type":"Community"},{"name":"Clubhouse - Shuffleboard","type":"Community"},{"name":"Comm Parking - Carport/Covered","type":"Community"},{"name":"Comm Parking - Detached Garage (Add Fee)","type":"Community"},{"name":"Comm Parking - Garage Structure (Free)","type":"Community"},{"name":"Fitness Center - 24 Hour Access","type":"Community"},{"name":"Fitness Center - Barre Studio","type":"Community"},{"name":"Fitness Center - Crossfit","type":"Community"},{"name":"Fitness Center - Elliptical","type":"Community"},{"name":"Fitness Center - Fitness Classes ","type":"Community"},{"name":"Fitness Center - Free Weights","type":"Community"},{"name":"Fitness Center - Stationary Bicycles","type":"Community"},{"name":"Fitness Center - Treadmills","type":"Community"},{"name":"Fitness Center - WellBeats ","type":"Community"},{"name":"Landscape - Lush Landscape","type":"Community"},{"name":"Landscape - Mature Landscape","type":"Community"},{"name":"Misc - Air Conditioned Hallways","type":"Community"},{"name":"Misc - Barbecue (BBQ) Grills","type":"Community"},{"name":"Misc - Bike Repair Station","type":"Community"},{"name":"Misc - Bike Storage","type":"Community"},{"name":"Misc - Boat Slips","type":"Community"},{"name":"Misc - Car Charging Stations","type":"Community"},{"name":"Misc - Carwash","type":"Community"},{"name":"Misc - Community Garden","type":"Community"},{"name":"Misc - Concierge Services","type":"Community"},{"name":"Misc - Corporate Units","type":"Community"},{"name":"Misc - Courtyards","type":"Community"},{"name":"Misc - Dry Cleaning Drop-off/Pick-up","type":"Community"},{"name":"Misc - Elevators","type":"Community"},{"name":"Misc - Guest Parking","type":"Community"},{"name":"Misc - Laundry Drop-off/Pick-up","type":"Community"},{"name":"Misc - Laundry Room","type":"Community"},{"name":"Misc - On-Site Storage","type":"Community"},{"name":"Misc - Outdoor Amphitheater","type":"Community"},{"name":"Misc - Outdoor Fireplace","type":"Community"},{"name":"Misc - Parcel Pending","type":"Community"},{"name":"Misc - Playground","type":"Community"},{"name":"Misc - Retail on Site ","type":"Community"},{"name":"Misc - Rooftop Deck","type":"Community"},{"name":"Misc - Storage for Rent","type":"Community"},{"name":"Misc - Surfboard Storage","type":"Community"},{"name":"Misc - Valet Trash","type":"Community"},{"name":"Misc - Wine Cellar","type":"Community"},{"name":"Misc - Wine Storage Locker (Add. Fee)","type":"Community"},{"name":"Pets - Kennel on Site","type":"Community"},{"name":"Pets - Pet Maintenance Station","type":"Community"},{"name":"Pets - Pet Park","type":"Community"},{"name":"Pool - Diving Pool","type":"Community"},{"name":"Pool - Hammocks","type":"Community"},{"name":"Pool - Heated Pool","type":"Community"},{"name":"Pool - Jaccuzi/Hot Tub/Spa","type":"Community"},{"name":"Pool - Lap Pool","type":"Community"},{"name":"Pool - Large Size Pool","type":"Community"},{"name":"Pool - Lounge","type":"Community"},{"name":"Pool - Luxury Cabanas","type":"Community"},{"name":"Pool - Multiple Pools","type":"Community"},{"name":"Pool - Pool with Slide","type":"Community"},{"name":"Pool - Resort Style","type":"Community"},{"name":"Pool - Salt Water Pool","type":"Community"},{"name":"Pool - Standard Size Pool","type":"Community"},{"name":"Pool - Wi-Fi (Free)","type":"Community"},{"name":"Recreation - Basketball Court","type":"Community"},{"name":"Recreation - Biking Trails","type":"Community"},{"name":"Recreation - Bocce Ball Court","type":"Community"},{"name":"Recreation - Boxing Studio","type":"Community"},{"name":"Recreation - Dance Studio","type":"Community"},{"name":"Recreation - Golf Course","type":"Community"},{"name":"Recreation - Horseshoe Pit","type":"Community"},{"name":"Recreation - Jogging Trails","type":"Community"},{"name":"Recreation - Massage Room","type":"Community"},{"name":"Recreation - Pilate Room","type":"Community"},{"name":"Recreation - Putting Green","type":"Community"},{"name":"Recreation - Racquetball","type":"Community"},{"name":"Recreation - Sand Volleyball Court","type":"Community"},{"name":"Recreation - Sauna","type":"Community"},{"name":"Recreation - Tanning Bed","type":"Community"},{"name":"Recreation - Tennis Court","type":"Community"},{"name":"Recreation - Volleyball Court","type":"Community"},{"name":"Recreation - Yoga Room","type":"Community"},{"name":"Security - Controlled Access","type":"Community"},{"name":"Security - Courtesy Patrol","type":"Community"},{"name":"Security - Gated Community","type":"Community"},{"name":"Security - Security Guards","type":"Community"},{"name":"Access to Freeways","type":"Location"},{"name":"Access to Parks","type":"Location"},{"name":"Beach Access","type":"Location"},{"name":"Lake Access","type":"Location"},{"name":"Near Biking/Walking Trails","type":"Location"},{"name":"Near Downtown/Employment","type":"Location"},{"name":"Near Golf Course","type":"Location"},{"name":"Near Public Transportation","type":"Location"},{"name":"Near Restaurants \u0026 Bars","type":"Location"},{"name":"Near Retail","type":"Location"},{"name":"Visibility","type":"Location"},{"name":"Walkability","type":"Location"},{"name":"Appliances - Black Appliances","type":"Unit"},{"name":"Appliances - Dishwasher","type":"Unit"},{"name":"Appliances - French Door Refrigerator","type":"Unit"},{"name":"Appliances - Gas Stove","type":"Unit"},{"name":"Appliances - Microwave","type":"Unit"},{"name":"Appliances - Refrigerator w/ Water\u0026Ice","type":"Unit"},{"name":"Appliances - Side by Side Refrigerator","type":"Unit"},{"name":"Appliances - Stainless Steel Appliances","type":"Unit"},{"name":"Appliances - Stove Hood","type":"Unit"},{"name":"Appliances - White Appliances","type":"Unit"},{"name":"Bath - Dual Vanity","type":"Unit"},{"name":"Bath - Roman/Garden Tub","type":"Unit"},{"name":"Bath - Separate Shower","type":"Unit"},{"name":"Bath - Steam Shower","type":"Unit"},{"name":"Bath - Under-Mount Sink","type":"Unit"},{"name":"Ceilings - Ceiling Fan","type":"Unit"},{"name":"Ceilings - Crown Molding","type":"Unit"},{"name":"Ceilings - High Ceilings (10ft)","type":"Unit"},{"name":"Ceilings - High Ceilings (10ft+)","type":"Unit"},{"name":"Ceilings - Vaulted Ceilings","type":"Unit"},{"name":"Features - Accent Color Walls","type":"Unit"},{"name":"Features - Air Conditioning","type":"Unit"},{"name":"Features - Backyard","type":"Unit"},{"name":"Features - Balcony","type":"Unit"},{"name":"Features - Built-In Bookshelves","type":"Unit"},{"name":"Features - Computer Desk","type":"Unit"},{"name":"Features - Corner Unit","type":"Unit"},{"name":"Features - Decor Shelving","type":"Unit"},{"name":"Features - Large Balcony","type":"Unit"},{"name":"Features - Linen Closet","type":"Unit"},{"name":"Features - Patio","type":"Unit"},{"name":"Features - Storage Room","type":"Unit"},{"name":"Features - Two-Inch Blinds","type":"Unit"},{"name":"Features - Venetian Blinds","type":"Unit"},{"name":"Features - Walk-in Closet","type":"Unit"},{"name":"Features - Wine Celler","type":"Unit"},{"name":"Features - Wine Cooler","type":"Unit"},{"name":"Features - Wood Blinds","type":"Unit"},{"name":"Fireplace - Gas","type":"Unit"},{"name":"Fireplace - Wood","type":"Unit"},{"name":"Floor Level - First Floor","type":"Unit"},{"name":"Floor Level - Second Floor","type":"Unit"},{"name":"Floor Level - Top Floor","type":"Unit"},{"name":"Flooring - Bamboo","type":"Unit"},{"name":"Flooring - Berber Carpet","type":"Unit"},{"name":"Flooring - Carpet","type":"Unit"},{"name":"Flooring - Laminate","type":"Unit"},{"name":"Flooring - Tile","type":"Unit"},{"name":"Flooring - Wood Flooring","type":"Unit"},{"name":"Kitchen - Backsplash","type":"Unit"},{"name":"Kitchen - Bar Top","type":"Unit"},{"name":"Kitchen - Breakfast Nook","type":"Unit"},{"name":"Kitchen - Dining Room","type":"Unit"},{"name":"Kitchen - Galley Kitchen Style","type":"Unit"},{"name":"Kitchen - Granite Countertops","type":"Unit"},{"name":"Kitchen - Kitchen Island","type":"Unit"},{"name":"Kitchen - Open Kitchen Style","type":"Unit"},{"name":"Kitchen - Pantry","type":"Unit"},{"name":"Kitchen - Quartz Countertops","type":"Unit"},{"name":"Kitchen - Under-Mount Sink","type":"Unit"},{"name":"Laundry - Dry Cleaning Services","type":"Unit"},{"name":"Laundry - Laundry Room in Unit","type":"Unit"},{"name":"Laundry - Stackable Washer/Dryer","type":"Unit"},{"name":"Laundry - Washer/Dryer Hookup","type":"Unit"},{"name":"Laundry - Washer/Dryer in Unit","type":"Unit"},{"name":"Layout - Den","type":"Unit"},{"name":"Layout - Floor-to-Ceiling Windows","type":"Unit"},{"name":"Layout - Handicap Unit","type":"Unit"},{"name":"Layout - Large Windows","type":"Unit"},{"name":"Layout - Loft Style","type":"Unit"},{"name":"Layout - Open Floor-plan","type":"Unit"},{"name":"Layout - Penthouse","type":"Unit"},{"name":"Layout - Townhome Style","type":"Unit"},{"name":"Layout- Study/Office","type":"Unit"},{"name":"Parking - Attached Garage (2 car)","type":"Unit"},{"name":"Parking - Attached Garage (to Unit)","type":"Unit"},{"name":"Parking - Carport (per Unit)","type":"Unit"},{"name":"Parking - Detached Garage (Free)","type":"Unit"},{"name":"Renovated - Upgraded Bath","type":"Unit"},{"name":"Renovated - Upgraded Kitchen","type":"Unit"},{"name":"Security - Alarm System","type":"Unit"},{"name":"Security - Alarm System (Pre-Wired)","type":"Unit"},{"name":"Tech - Cable TV (Avail.)","type":"Unit"},{"name":"Tech - Cable TV (Incl.)","type":"Unit"},{"name":"Tech - Dish/Satellite TV (Avail.)","type":"Unit"},{"name":"Tech - Dish/Satellite TV (Incl.)","type":"Unit"},{"name":"Tech - High Speed Internet (Incl.)","type":"Unit"},{"name":"Tech - Sound System","type":"Unit"},{"name":"Tech - USB Outlets","type":"Unit"},{"name":"Tech - Wireless Internet (Avail.)","type":"Unit"},{"name":"Views - Courtyard View","type":"Unit"},{"name":"Views - Mountain View","type":"Unit"},{"name":"Views - Ocean View","type":"Unit"},{"name":"Views - Pool View","type":"Unit"},{"name":"Views - Skyline/City View","type":"Unit"}];
    async.eachLimit(amenitites, 10, function(amenity, callbackp){
        AmenityService.create(System, context, amenity, function (err, am) {
            callbackp(err, am)
        });
    }, function(err) {
        callback();
    });
}
var RolesAssignPermissionsCreate = function(roles, callback) {
    var permissions = [
        {executorid: roles.BiradixAdmin._id, resource: roles.BiradixAdmin._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.BiradixAdmin._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.GreystarCM._id, resource: roles.GreystarCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarPO._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.AllianceCM._id, resource: roles.AllianceCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AllianceRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AllianceRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AlliancePO._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.WoodCM._id, resource: roles.WoodCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodPO._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.DemoCM._id, resource: roles.DemoCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},
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

var PropertiesCreate = function(System, companies,callback) {
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
    var Marcus = { name: 'Marcus Aurelius Place', address: '7800 E. McDowell Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 786-3323', owner: 'Roman Residential Services', management: 'Roman Residential Services', yearBuilt: 2006, orgid: companies.Greystar._id, constructionType: 'Garden', notes: 'Concessions: $500 Off Move-In on a 12 month lease. Comments: Deposit wavied OAC', fees: {
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

    var Test1 = { name: 'Test property 1', address: '7135 E Camelback Rd', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(480) 751-2200', owner: 'Fox Concept', management: 'Fancy Smiths', yearBuilt: 2005, orgid: companies.Demo._id, constructionType: 'Garden', notes: '', fees: {
        application_fee : '$50',
        lease_terms: '12 months',
        short_term_premium: '$400',
        refundable_security_deposit: '$200',
        administrative_fee: '$200',
        non_refundable_pet_deposit: '$200',
        pet_deposit: '$200',
        pet_rent: '$25,$50'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 10, sqft: 1000, amenities: []},
        {bedrooms:1, bathrooms: '1', description: '', units: 10, sqft: 1200, amenities: []},
        {bedrooms:2, bathrooms: '2', description: '', units: 10, sqft: 2000, amenities: []},
        {bedrooms:2, bathrooms: '2', description: '', units: 10, sqft: 2200, amenities: []},
    ]
        , community_amenities: []
        , location_amenities: []
    }

    var Test2 = { name: 'Test property 2', address: '7025 E Via Soleri Dr', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(480) 398-8200', owner: 'Zues Inc', management: 'Apollo', yearBuilt: 2007, orgid: companies.Demo._id, constructionType: 'Garden', notes: '', fees: {
        application_fee : '$75',
        lease_terms: '3-13 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$400',
        administrative_fee: '$300',
        non_refundable_pet_deposit: '$400',
        pet_deposit: '$200',
        pet_rent: '$30'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 30, sqft: 500, amenities: []},
        {bedrooms:2, bathrooms: '2', description: '', units: 30, sqft: 1000, amenities: []},
    ]
        , community_amenities: []
        , location_amenities: []
    }

    var Test3 = { name: 'Test property 3', address: '7157 E Rancho Vista Dr', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(480) 874-9900', owner: 'Titan', management: 'Aphrodite', yearBuilt: 2011, orgid: companies.Demo._id, constructionType: 'Mid-Rise', notes: '', fees: {
        application_fee : '$100',
        lease_terms: '6 months',
        short_term_premium: '$250',
        refundable_security_deposit: '$600',
        administrative_fee: '$400',
        non_refundable_pet_deposit: '$500',
        pet_deposit: '$300',
        pet_rent: '$45'
    }, floorplans: [
        {bedrooms:1, bathrooms: '1', description: '', units: 20, sqft: 1000, amenities: []},
        {bedrooms:2, bathrooms: '2', description: '', units: 20, sqft: 2000, amenities: []},
    ]
        , community_amenities: []
        , location_amenities: []
    }
    async.parallel({
        Aurelian: function (callbackp) {
            CreateService.create(System, context, Aurelian, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Augustus: function (callbackp) {
            CreateService.create(System, context,Augustus, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Nero: function (callbackp) {
            CreateService.create(System, context,Nero, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Marcus: function (callbackp) {
            CreateService.create(System, context,Marcus, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Geta: function (callbackp) {
            CreateService.create(System, context,Geta, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Titus: function (callbackp) {
            CreateService.create(System, context,Titus, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Probus: function (callbackp) {
            CreateService.create(System, context,Probus, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Test1: function (callbackp) {
            CreateService.create(System, context,Test1, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Test2: function (callbackp) {
            CreateService.create(System, context,Test2, function (err, prop) {
                    if (err) {
                        throw("Unable to seed: " + err[0].msg);
                    }
                    callbackp(null, prop)
                }
            );
        },
        Test3: function (callbackp) {
            CreateService.create(System, context,Test3, function (err, prop) {
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
                    if (props[prop]._id.toString() != props[prop2]._id.toString() && ['Test1','Test2','Test3'].indexOf(prop) == -1 && ['Test1','Test2','Test3'].indexOf(prop2) == -1 ) {
                        links.push({subjectid: props[prop]._id, compid: props[prop2]._id})
                    }
                }

            }

        links.push({subjectid: props['Test1']._id, compid: props['Test2']._id});
        links.push({subjectid: props['Test1']._id, compid: props['Test3']._id});

            async.eachLimit(links, 10, function(link, callbackp){
                PropertyService.linkComp(System, context, null, link.subjectid, link.compid, function (err, l) {
                    callbackp(err, l)
                });
            }, function(err) {
                callback(props)
            });


        }
    );


}
var UsersCreate = function(roles, callback) {

    var System = {email : "admin@biradix.com", password: "$%%##FSDFSD", first : "System", last : "User", isSystem : true, roleids: [roles.BiradixAdmin._id], passwordUpdated: true};
    var Eugene = {email : "eugene@biradix.com", password: "BIradix11!!", first : "Eugene", last : "K", roleids: [roles.BiradixAdmin._id], passwordUpdated: true};
    var Blerim = {email : "blerim@biradix.com", password: "BIradix11!!", first : "Blerim", last : "Z", roleids: [roles.BiradixAdmin._id], passwordUpdated: true};
    var Alex = {email : "alex@biradix.com", password: "BIradix11!!", first : "Alex", last : "V", roleids: [roles.BiradixAdmin._id], legacty_hash: "", passwordUpdated: true};
    var TestAdmin = {email : "testadmin@biradix.com", password: "temppass!", first : "Test", last : "Admin", roleids: [roles.BiradixAdmin._id], passwordUpdated: true};
    var TestDemo = {email : "testbm@biradix.com", password: "temppass!", first : "Test", last : "BM", roleids: [roles.DemoBM._id], passwordUpdated: true};

    UserCreateService.insert(null, context, System, null, function(errors, usr) {
        if (errors) {
            throw("Unable to seed System: " + errors[0].msg);
        }

        UserService.getSystemUser(function(s) {
            System = s.user;
            async.parallel({
                    Alex: function(callbackp) {
                        UserCreateService.insert(System, context, Alex, null, function(errors, usr) {
                                if (errors) {
                                    throw("Unable to seed Alex: " + errors[0].msg);
                                }
                                callbackp(null, usr)
                            }
                        );
                    },
                    Eugene: function(callbackp) {
                        UserCreateService.insert(System, context, Eugene, null, function(errors, usr) {
                                if (errors) {
                                    throw("Unable to seed Eugene: " + errors[0].msg);
                                }
                                callbackp(null, usr)
                            }
                        );
                    },
                    Blerim: function(callbackp) {
                        UserCreateService.insert(System, context, Blerim, null,function(errors, usr) {
                            if (errors) {
                                throw("Unable to seed Blerim: " + errors[0].msg);
                            }
                            callbackp(null, usr)
                        })
                    },
                    TestAdmin: function(callbackp) {
                        if (!settings.SEED_TEST) {
                            return callbackp(null, null);
                        }
                        UserCreateService.insert(System, context, TestAdmin, null,function(errors, usr) {
                            if (errors) {
                                throw("Unable to seed Blerim: " + errors[0].msg);
                            }
                            callbackp(null, usr)
                        })
                    },
                    TestDemo: function(callbackp) {
                        if (!settings.SEED_TEST) {
                            return callbackp(null, null);
                        }
                        UserCreateService.insert(System, context, TestDemo, null,function(errors, usr) {
                            if (errors) {
                                throw("Unable to seed Blerim: " + errors[0].msg);
                            }
                            callbackp(null, usr)
                        })
                    }
                },function(err, users) {
                    users.System = System;
                    callback(users)
                }
            );
        })



    });


}

var RolesCreate = function(Orgs, callback) {
    var BiradixAdmin = {name: "Site Admin", isadmin: true, tags: ['Admin'], orgid : Orgs.Biradix._id}
    var Guest = {name: "Guest", tags: ['Guest'], orgid : Orgs.Biradix._id}
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
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Biradix;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        Guest: function(callbackp) {
            AccessService.createRole(Guest, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Biradix;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        AllianceCM: function(callbackp) {
            AccessService.createRole(AllianceCM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Alliance;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        AllianceRM: function(callbackp) {
            AccessService.createRole(AllianceRM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Alliance;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        AllianceBM: function(callbackp) {
            AccessService.createRole(AllianceBM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Alliance;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        AlliancePO: function(callbackp) {
            AccessService.createRole(AlliancePO, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Alliance;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        DemoCM: function(callbackp) {
            AccessService.createRole(DemoCM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Demo;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        DemoRM: function(callbackp) {
            AccessService.createRole(DemoRM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Demo;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        DemoBM: function(callbackp) {
            AccessService.createRole(DemoBM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Demo;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        DemoPO: function(callbackp) {
            AccessService.createRole(DemoPO, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Demo;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        WoodCM: function(callbackp) {
            AccessService.createRole(WoodCM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Wood;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        WoodRM: function(callbackp) {
            AccessService.createRole(WoodRM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Wood;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        WoodBM: function(callbackp) {
            AccessService.createRole(WoodBM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Wood;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        WoodPO: function(callbackp) {
            AccessService.createRole(WoodPO, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Wood;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        GreystarCM: function(callbackp) {
            AccessService.createRole(GreystarCM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Greystar;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        GreystarRM: function(callbackp) {
            AccessService.createRole(GreystarRM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Greystar;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },
        GreystarBM: function(callbackp) {
            AccessService.createRole(GreystarBM, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Greystar;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})

            });
        },
        GreystarPO: function(callbackp) {
            AccessService.createRole(GreystarPO, function(err, role){
                role = JSON.parse(JSON.stringify(role));
                role.org = Orgs.Greystar;
                AccessService.upsertOrgRole_read(role, function(err) {callbackp(err, role)})
            });
        },

},function(err, roles) {

        if (err) {
            throw new Error(err);
        }
        callback(roles)}
        )


}

var CompaniesCreate = function(callback) {
    var Biradix = {name: "BI:Radix", subdomain: 'platform', logoBig: 'biradix.png', logoSmall: 'biradix-small.png', isDefault : true}
    var Demo = {name: "Demo Residential", subdomain: 'demo', logoBig: 'greystar.png', logoSmall: 'greystar-small.png'}
    var Greystar = {name: "Greystar", subdomain: 'greystar', logoBig: 'greystar.png', logoSmall: 'greystar-small.png'}
    var Wood = {name: "Wood Residential", subdomain: 'wood', logoBig: 'wood.png', logoSmall: 'wood-small.png'}
    var Alliance = {name: "Alliance Residential", subdomain: 'alliance', logoBig: 'biradix.png', logoSmall: 'biradix-small.png'}

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
            throw new Error(JSON.stringify(err));

        }
        callback(orgs)
    })


}

var AssignProperties = function(users, properties, callback) {
    propertyUsersService.link(users.System,context,null,users.TestDemo._id, properties.Augustus._id, function() {});
    propertyUsersService.link(users.System,context,null,users.TestDemo._id, properties.Aurelian._id, function() {});
    callback();
}

var PermissionsCreate = function(roles, callback) {

    var permissions = [
        {executorid: roles.BiradixAdmin._id, resource: "Users/LogInAs", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/Create", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Org/Assign", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "History/MoreInfo", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Admin", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},

        {executorid: roles.Guest._id, resource: "Hide/Dashboard", allow: true, type: 'Execute'},
        {executorid: roles.Guest._id, resource: "Hide/Search", allow: true, type: 'Execute'},
        {executorid: roles.Guest._id, resource: "Hide/Reporting", allow: true, type: 'Execute'},
        {executorid: roles.Guest._id, resource: "Hide/Account", allow: true, type: 'Execute'},
        {executorid: roles.Guest._id, resource: "Hide/ExtendedProfile", allow: true, type: 'Execute'},

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
        {executorid: roles.GreystarCM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},

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
        {executorid: roles.AllianceCM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},

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
        {executorid: roles.WoodCM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},

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
        {executorid: roles.DemoCM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},

    ];

    async.eachLimit(permissions, 10, function(permission, callbackp){
        AccessService.createPermission(permission, function (err, perm) {
            callbackp(err, perm)
        });
    }, function(err) {
        callback();
    });




}

