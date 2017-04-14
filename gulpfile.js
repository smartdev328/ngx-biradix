var concat = require('gulp-concat');
var replace = require('gulp-replace');
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

    ])
        .pipe(concat('vendors.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('vendorscss', function() {
    return gulp.src([
        './bower_components/bootstrap/dist/css/bootstrap.min.css'
        , './bower_components/font-awesome/css/font-awesome.min.css'
        , './site/components/angular-toastr/angular-toastr.min.css'
        , './site/components/ngProgress/ngProgress.css'
    ])
        .pipe(concat('vendors.css'))
        .pipe(replace(/..\/fonts\//g,'/bower_components/font-awesome/fonts/'))
        .pipe(gulp.dest('./dist/'));
});