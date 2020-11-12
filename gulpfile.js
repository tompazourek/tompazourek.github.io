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

gulp.task('clean-main-bower-files', function() {
    return gulp.src(paths.mainBowerComponentsDest, { allowEmpty: true })
        .pipe(vinylPaths(del));
});

// copy some files from 'bower_components'
gulp.task('main-bower-files', gulp.series('clean-main-bower-files', function() {
    return gulp.src(mainBowerFiles(), { base: paths.mainBowerComponentsSrc })
        .pipe(gulp.dest(paths.mainBowerComponentsDest));
}));

// compile LESS to CSS
gulp.task('clean-less', function() {
    return gulp.src(paths.lessClean, { allowEmpty: true })
        .pipe(vinylPaths(del));
});
gulp.task('less-dev', gulp.series('clean-less', 'main-bower-files', function() {
    return gulp.src(paths.lessSrc)
        .pipe(plumber(plumberOptions))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.lessDest))
        .pipe(livereload());
}));
gulp.task('less-dev-fast', function() {
    return gulp.src(paths.lessSrc)
        .pipe(plumber(plumberOptions))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.lessDest))
        .pipe(livereload());
});
gulp.task('less', gulp.series('clean-less', 'main-bower-files', function() {
    return gulp.src(paths.lessSrc)
        .pipe(less())
        .pipe(gulp.dest(paths.lessDest));
}));

// minify CSS files
gulp.task('minify-css', gulp.series('less', function() {
  return gulp.src(paths.minifySrc)
    .pipe(minifyCSS())
    .pipe(gulp.dest(paths.minifyDest))
}));

// compile Jade to HTML
gulp.task('clean-jade', function() {
    return gulp.src(paths.jadeClean, { allowEmpty: true })
        .pipe(vinylPaths(del));
});
gulp.task('jade-dev', gulp.series('clean-jade', function() {
    return gulp.src(paths.jadeSrc)
        .pipe(plumber(plumberOptions))
        .pipe(data(getJadeData))
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest(paths.jadeDest))
        .pipe(livereload());
}));
gulp.task('jade', gulp.series('clean-jade', function() {
    return gulp.src(paths.jadeSrc)
        .pipe(data(getJadeData))
        .pipe(jade({ pretty: false }))
        .pipe(gulp.dest(paths.jadeDest));
}));
function getJadeData() {
    return JSON.parse(fs.readFileSync(paths.jadeData));
}

// copy font files
gulp.task('clean-copy-fonts', function() {
    return gulp.src(paths.copyFontsClean, { allowEmpty: true })
        .pipe(vinylPaths(del));
});
gulp.task('copy-fonts', gulp.series('main-bower-files', 'clean-copy-fonts', function() {
    return gulp.src(paths.copyFontsSrc)
        .pipe(gulp.dest(paths.copyFontsDest));
}));
gulp.task('clean-copy-fonts', function() {
    return gulp.src(paths.copyFontsClean, { allowEmpty: true })
        .pipe(vinylPaths(del));
});

// copy images
gulp.task('clean-copy-images', function() {
    return gulp.src(paths.copyImagesClean, { allowEmpty: true })
        .pipe(vinylPaths(del));
});
gulp.task('copy-images', gulp.series('clean-copy-images', function() {
    return gulp.src(paths.copyImagesSrc)
        .pipe(gulp.dest(paths.copyImagesDest));
}));

// cleans all files created by gulp
gulp.task('clean', gulp.parallel('clean-main-bower-files', 'clean-less', 'clean-jade', 'clean-copy-fonts', 'clean-copy-images'));

// compile for production
gulp.task('default', gulp.parallel('minify-css', 'jade', 'copy-fonts', 'copy-images'));

// compile for development
gulp.task('dev', gulp.parallel('less-dev', 'jade-dev', 'copy-fonts', 'copy-images'));

// start static server
gulp.task('server', function(done) {
  http.createServer(
    st({ path: __dirname, index: 'index.html', cache: false })
  ).listen(8080, done);
});

// compile on the fly for development
gulp.task('watch', gulp.series('dev', function() {
    livereload.listen();
    gulp.watch(paths.lessWatch, gulp.series('less-dev-fast'));
    gulp.watch([paths.jadeSrc, paths.jadeData], gulp.series('jade-dev'));
}));

// start both server and watch (both needed for livereload)
gulp.task('server-watch', gulp.series('server', 'watch'));
