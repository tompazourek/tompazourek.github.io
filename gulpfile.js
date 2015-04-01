'use strict';

var fs = require('fs');
var http = require('http');
var st = require('st');

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var mainBowerFiles = require('main-bower-files');
var less = require('gulp-less');
var notify = require('gulp-notify');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var jade = require('gulp-jade');
var data = require('gulp-data');
var livereload = require('gulp-livereload');

var paths = {

    mainBowerComponentsSrc: './bower_components',
    mainBowerComponentsDest: './src/third-party',

    lessSrc: './src/styles/main.less',
    lessWatch: './src/styles/*.less',
    lessDest: './dist/styles',
    lessClean: './dist/styles',

    minifySrc: './dist/styles/*.css',
    minifyDest: './dist/styles',

    jadeSrc: './src/templates/index.jade',
    jadeData: './src/templates/data.json',
    jadeDest: '.',
    jadeClean: './index.html',

    copyFontsSrc: './src/third-party/**/*.{ttf,otf,woff,woff2,eot,svg}',
    copyFontsDest: './dist/third-party',
    copyFontsClean: './dist/third-party',
    
    copyImagesSrc: './src/images/*',
    copyImagesDest: './dist/images',
    copyImagesClean: './dist/images',
};

var plumberOptions = { errorHandler: notify.onError('<%= error.message %>') };

// copy some files from 'bower_components'
gulp.task('main-bower-files', ['clean-main-bower-files'], function() {
    return gulp.src(mainBowerFiles(), { base: paths.mainBowerComponentsSrc })
        .pipe(gulp.dest(paths.mainBowerComponentsDest));
});
gulp.task('clean-main-bower-files', function() {
    return gulp.src(paths.mainBowerComponentsDest)
        .pipe(vinylPaths(del));
});

// compile LESS to CSS
gulp.task('less-dev', ['clean-less', 'main-bower-files'], function() {
    return gulp.src(paths.lessSrc)
        .pipe(plumber(plumberOptions))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.lessDest))
        .pipe(livereload());
});
gulp.task('less-dev-fast', function() {
    return gulp.src(paths.lessSrc)
        .pipe(plumber(plumberOptions))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.lessDest))
        .pipe(livereload());
});
gulp.task('less', ['clean-less', 'main-bower-files'], function() {
    return gulp.src(paths.lessSrc)
        .pipe(less())
        .pipe(gulp.dest(paths.lessDest));
});
gulp.task('clean-less', function() {
    return gulp.src(paths.lessClean)
        .pipe(vinylPaths(del));
});

// minify CSS files
gulp.task('minify-css', ['less'], function() {
  return gulp.src(paths.minifySrc)
    .pipe(minifyCSS())
    .pipe(gulp.dest(paths.minifyDest))
});

// compile Jade to HTML
gulp.task('jade-dev', ['clean-jade'], function() {
    return gulp.src(paths.jadeSrc)
        .pipe(plumber(plumberOptions))
        .pipe(data(getJadeData))
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest(paths.jadeDest))
        .pipe(livereload());
});
gulp.task('jade', ['clean-jade'], function() {
    return gulp.src(paths.jadeSrc)
        .pipe(data(getJadeData))
        .pipe(jade({ pretty: false }))
        .pipe(gulp.dest(paths.jadeDest));
});
function getJadeData() {
    return JSON.parse(fs.readFileSync(paths.jadeData));
}
gulp.task('clean-jade', function() {
 return gulp.src(paths.jadeClean)
        .pipe(vinylPaths(del));
});

// copy font files
gulp.task('copy-fonts', ['main-bower-files', 'clean-copy-fonts'], function() {
    return gulp.src(paths.copyFontsSrc)
        .pipe(gulp.dest(paths.copyFontsDest));
});
gulp.task('clean-copy-fonts', function() {
    return gulp.src(paths.copyFontsClean)
        .pipe(vinylPaths(del));
});

// copy images
gulp.task('copy-images', ['clean-copy-images'], function() {
    return gulp.src(paths.copyImagesSrc)
        .pipe(gulp.dest(paths.copyImagesDest));
});
gulp.task('clean-copy-images', function() {
    return gulp.src(paths.copyImagesClean)
        .pipe(vinylPaths(del));
});

// cleans all files created by gulp
gulp.task('clean', ['clean-main-bower-files', 'clean-less', 'clean-jade', 'clean-copy-fonts', 'clean-copy-images']);

// compile for production
gulp.task('default', ['minify-css', 'jade', 'copy-fonts', 'copy-images']);

// compile for development
gulp.task('dev', ['less-dev', 'jade-dev', 'copy-fonts', 'copy-images']);

// start static server
gulp.task('server', function(done) {
  http.createServer(
    st({ path: __dirname, index: 'index.html', cache: false })
  ).listen(8080, done);
});

// compile on the fly for development
gulp.task('watch', ['dev'], function() {
    livereload.listen();
    gulp.watch(paths.lessWatch, ['less-dev-fast']);
    gulp.watch([paths.jadeSrc, paths.jadeData], ['jade-dev']);
});

// start both server and watch (both needed for livereload)
gulp.task('server-watch', ['server', 'watch']);
