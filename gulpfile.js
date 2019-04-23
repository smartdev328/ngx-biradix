var concat = require("gulp-concat");
var replace = require("gulp-replace");
var hashsum = require("gulp-hashsum")
var sass = require("gulp-sass");
var merge = require("merge-stream");
var gulp = require("gulp");
const nodemon = require("nodemon");
const livereload = require("gulp-livereload");
const filesExist = require("files-exist");

gulp.task("vendorsjs", function() {
    const files = [
        "./bower_components/jquery/dist/jquery.min.js",
        "./bower_components/jquery-ui/jquery-ui.min.js",
        "./bower_components/bootstrap/dist/js/bootstrap.min.js",
        "./bower_components/angular/angular.min.js",
        "./bower_components/angular-cookies/angular-cookies.min.js",
        "./bower_components/angular-sanitize/angular-sanitize.min.js",
        "./bower_components/angular-ui-router/release/angular-ui-router.min.js",
        "./bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
        "./bower_components/lodash/lodash.min.js",
        "./bower_components/moment/min/moment.min.js",
        "./bower_components/highcharts-release/highcharts.js",
        "./bower_components/angular-ui-sortable/sortable.min.js",
        "./site/components/ngProgress/ngProgress.min.js",
        "./site/components/angular-toastr/angular-toastr.tpls.min.js",
        "./site/components/daterangepicker/daterangepicker.js",
        "./site/components/select/customSelect.js",
        "./site/libs/jquery-ui-touch-punch/jquery.ui.touch-punch.min.js",
        "./node_modules/xlsx-style/dist/xlsx.core.min.js",
    ];

    return gulp.src(filesExist(files))
        .pipe(concat("vendors.js"))
        .pipe(gulp.dest("./dist/"))
        .pipe(hashsum({dest: "./dist", json: true, filename: "vendorsjs-hash.json"}))
        .pipe(livereload());
});

gulp.task("vendorscss", function() {
    const files = [
        "./bower_components/bootstrap/dist/css/bootstrap.min.css",
        "./bower_components/font-awesome/css/font-awesome.min.css",
        "./site/components/angular-toastr/angular-toastr.min.css",
        "./site/components/ngProgress/ngProgress.css",
        "./site/components/daterangepicker/daterangepicker-bs3.css",
        "./site/components/select/style.css",
    ];

    return gulp.src(filesExist(files))
        .pipe(concat("vendors.css"))
        .pipe(replace(/..\/fonts\//g, "/bower_components/font-awesome/fonts/"))
        .pipe(gulp.dest("./dist/"))
        .pipe(hashsum({dest: "./dist", json: true, filename: "vendorscss-hash.json"}))
        .pipe(livereload());
});

gulp.task("globaljs", function() {
    return gulp.src([
          "./site/modules/module.global.js",
        "./site/components/timeseries/module.js",
        "./site/components/barchart/module.js",
        "./site/components/toggle/module.js",
        "./site/components/filterlist/module.js",
        "./site/components/filterlist/moduleajax.js",
        "./site/components/googleMap/module.js",
        "./site/components/daterangepicker/module.js",
        "./site/components/ngEnter/module.js",
        "./site/components/dialog/module.js",
        "./site/components/uploader/module.js",
        "./site/components/gallery/module.js",

        "./site/services/authService.js",
        "./site/services/propertyService.js",
        "./site/services/marketSurveyService.js",
        "./site/services/marketSurveyPMSService.js",
        "./site/services/amenityService.js",
        "./site/services/reputationService.js",
        "./site/services/keenService.js",
        "./site/services/importService.js",
        "./site/services/importIntegrationService.js",
        "./site/services/cookieSettingsService.js",
        "./site/services/progressService.js",
        "./site/services/auditService.js",
        "./site/services/reportingService.js",
        "./site/services/saveReportService.js",
        "./site/services/urlService.js",
        "./site/services/gridService.js",
        "./site/services/userService.js",
        "./site/services/organizationsService.js",
        "./site/services/propertyUsersService.js",
        "./site/services/mediaService.js",
        "./site/services/approvedListsService.js",

        "./site/components/propertyProfile/coverPage.js",
        "./site/components/propertyProfile/profile.js",
        "./site/components/propertyProfile/about.js",
        "./site/components/propertyProfile/fees.js",
        "./site/components/propertyProfile/amenities.js",
        "./site/components/propertyProfile/floorplans.js",
        "./site/components/propertyProfile/tableView.js",
        "./site/components/propertyProfile/comps.js",

        "./site/components/jstimezonedetect/jstz.min.js",

        "./site/app/rootController.js",
        "./site/app/marketSurvey/marketSurveyController.js",
        "./site/app/marketSurvey/marketSurveyOccupancyController.js",
        "./site/app/marketSurvey/marketSurveyLeasedController.js",
        "./site/app/marketSurvey/marketSurveyTrafficController.js",
        "./site/app/marketSurvey/marketSurveyATRController.js",
        "./site/app/marketSurvey/marketSurveyLeasesController.js",
        "./site/app/marketSurvey/marketSurveyFloorplanController.js",

        "./site/components/reports/communityAmenities.js",
        "./site/components/reports/locationAmenities.js",
        "./site/components/reports/reputationReport.js",
        "./site/components/reports/feesDeposits.js",
        "./site/components/reports/propertyRankings.js",
        "./site/components/reports/propertyRankingsSummary.js",
        "./site/components/reports/propertyStatus.js",
        "./site/components/reports/customPortfolio.js",
        "./site/components/reports/propertyReport.js",
        "./site/components/reports/trendsReport.js",
        "./site/components/reports/trendsTimeseries.js",
        "./site/components/reports/concession.js",
    ])
        .pipe(concat("global.js"))
        .pipe(gulp.dest("./dist/"))
        .pipe(hashsum({dest: "./dist", json: true, filename: "globaljs-hash.json"}))
        .pipe(livereload());
});

gulp.task("globalcss", function() {
    const cssFiles = [
        "./site/app/global.css",
        "./site/app/login/loggedout.css",
        "./site/css/navs.css",
        "./site/css/grids.css",
        "./site/css/tabs.css",
        "./site/css/forms.css",
        "./site/css/icons.css",
        "./site/css/spacing.css",
        "./site/components/toggle/style.css",
        "./site/components/filterlist/filterlist.css",
        "./site/components/reports/reporting.css",
        "./site/components/uploader/styles.css",
        "./site/app/updateprofile/updateProfile.css",
        "./site/app/contact/contact.css",
        "./site/app/propertyWizard/propertyWizard.css",
        "./site/app/marketSurvey/marketSurvey.css",
    ];

    const cssStream = gulp.src(filesExist(cssFiles));

    const sassFiles = [
        "./site/components/gallery/styles.scss",
    ];

    const sassStream = gulp.src(filesExist(sassFiles)).pipe(sass().on("error", sass.logError));

    return merge(cssStream, sassStream)
        .pipe(concat("global.css"))
        .pipe(gulp.dest("./dist/"))
        .pipe(hashsum({dest: "./dist", json: true, filename: "globalcss-hash.json"}))
        .pipe(livereload());
});

gulp.task("watch", function() {
    livereload.listen();
    gulp.run("vendorscss");
    gulp.run("globalcss");
    gulp.run("vendorsjs");
    gulp.run("globaljs");
    nodemon({
        script: "workers/web.js",
        // watch: "dist",
        env: {"NODE_ENV": "development"},
    });
    gulp.watch("site/**/*.css", ["globalcss", "vendorscss"]);
    gulp.watch("site/**/*.js", ["globaljs", "vendorsjs"]);

    gulp.watch("site/**/*.htm*", function(files) {
        livereload.reload(files);
    });
});
