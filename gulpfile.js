var concat = require('gulp-concat');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var hashsum = require("gulp-hashsum")
var gulp = require('gulp');

gulp.task('vendorsjs', function() {
    return gulp.src([
          './bower_components/jquery/dist/jquery.min.js'
        , './bower_components/bootstrap/dist/js/bootstrap.min.js'
        , './bower_components/angular/angular.min.js'
        , './bower_components/angular-cookies/angular-cookies.min.js'
        , './bower_components/angular-sanitize/angular-sanitize.min.js'
        , './bower_components/angular-ui-router/release/angular-ui-router.min.js'
        , './bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js'
        , './bower_components/lodash/lodash.min.js'
        , './bower_components/moment/min/moment.min.js'
        , './bower_components/highcharts-release/highcharts.js'
        , './site/components/ngProgress/ngProgress.min.js'
        , './site/components/angular-toastr/angular-toastr.tpls.min.js'
        , './site/components/daterangepicker/daterangepicker.js'

    ])
        .pipe(concat('vendors.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(hashsum({dest: "./dist",json:true, filename: 'vendorsjs-hash.json'}));
});

gulp.task('vendorscss', function() {
    return gulp.src([
        './bower_components/bootstrap/dist/css/bootstrap.min.css'
        , './bower_components/font-awesome/css/font-awesome.min.css'
        , './site/components/angular-toastr/angular-toastr.min.css'
        , './site/components/ngProgress/ngProgress.css'
        , './site/components/daterangepicker/daterangepicker-bs3.css'
    ])
        .pipe(concat('vendors.css'))
        .pipe(replace(/..\/fonts\//g,'/bower_components/font-awesome/fonts/'))
        .pipe(gulp.dest('./dist/'))
        .pipe(hashsum({dest: "./dist",json:true, filename: 'vendorscss-hash.json'}));
});

gulp.task('globaljs', function() {
    return gulp.src([
          './site/modules/module.global.js'
        , './site/components/timeseries/module.js'
        , './site/components/toggle/module.js'
        , './site/components/filterlist/module.js'
        , './site/components/googleMap/module.js'
        , './site/components/daterangepicker/module.js'
        , './site/components/ngEnter/module.js'
        , './site/components/dialog/module.js'

        , './site/services/authService.js'
        , './site/services/propertyService.js'
        , './site/services/amenityService.js'
        , './site/services/cookieSettingsService.js'
        , './site/services/progressService.js'
        , './site/services/auditService.js'
        , './site/services/reportingService.js'
        , './site/services/urlService.js'
        , './site/services/gridService.js'
        , './site/services/userService.js'
        , './site/services/propertyUsersService.js'

        , './site/components/propertyProfile/coverPage.js'
        , './site/components/propertyProfile/profile.js'

        , './site/components/propertyProfile/about.js'
        , './site/components/propertyProfile/fees.js'
        , './site/components/propertyProfile/amenities.js'
        , './site/components/propertyProfile/floorplans.js'
        , './site/components/propertyProfile/tableView.js'
        , './site/components/propertyProfile/comps.js'

        , './site/app/rootController.js'
    ])
        .pipe(concat('global.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(hashsum({dest: "./dist",json:true, filename: 'globaljs-hash.json'}));
});

gulp.task('globalcss', function() {
    return gulp.src([
        , './site/app/global.css'
        , './site/app/login/loggedout.css'
        , './site/css/navs.css'
        , './site/css/grids.css'
        , './site/components/toggle/style.css'
        , './site/components/filterlist/filterlist.css'
        , './site/components/reports/reporting.css'
    ])
        .pipe(concat('global.css'))
        .pipe(gulp.dest('./dist/'))
        .pipe(hashsum({dest: "./dist",json:true, filename: 'globalcss-hash.json'}));
});