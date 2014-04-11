'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var stylish = require('jshint-stylish');
var header = require('gulp-header');
var jsdoc = require("gulp-jsdoc");

var minHeader = 
     '/*! jQuery.Q.js - v1.1 - 2014-03-12\n'
    +'* https://github.com/jsbuzz/jQuery_Q\n'
    +'* Copyright (c) 2014 Matyas Buczko; Licensed GPL2 */\n';

// Uglify app js (created with r.js, see ./build.sh)
gulp.task('minify', function() {
    return gulp.src('jquery.Q.js')
        .pipe(uglify())
        .pipe(rename('jquery.Q.min.js'))
        .pipe(header(minHeader))
        .pipe(gulp.dest('.'));
});

// Lint JS files
gulp.task('lint', function() {
    return true;/* gulp.src('jquery.Q.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));*/
});

// jsDoc task
gulp.task('jsdoc', function() {
    return gulp.src('jquery.Q.js')
            .pipe(jsdoc('./jsdoc'));
});


// Default task
gulp.task('default', ['minify']);

// watch task
gulp.task('watch', ['minify']);

// Build task - use ./build.sh though, as does some other stuff
gulp.task('build', ['minify', 'jsdoc']);
