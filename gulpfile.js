'use strict';
/* CONSTANTS */
/* Plugins and modules */
const del = require('del'); //+
const gulp = require('gulp'); //+
const path = require('path'); //+
const autoprefixer = require('gulp-autoprefixer'); //+
const cached = require('gulp-cached'); //+
const minCSS = require('gulp-cssnano'); //+
const debug = require('gulp-debug'); //+
const livereload = require('gulp-livereload'); //+
const notify = require('gulp-notify'); //+
const plumber = require('gulp-plumber'); //+
const remember = require('gulp-remember'); //+
const doSass = require('gulp-sass'); //+
const sourceMaps = require('gulp-sourcemaps'); //+
const uglify = require('gulp-uglify'); //+

/* VARIABLES
 Please note that the values of the variables are specified WITHOUT slashes at edges!
 */
var frontend_css_path = 'scss';
var production_css_path = 'css';
//var deploy_css_path = 'deploy/css';

//var frontend_js_path = 'frontend/js_source';
//var production_js_path = 'production/app/webroot/js';
//var deploy_js_path = 'deploy/js';

//var frontend_libs_path = 'frontend/libs_source';
//var production_libs_path = 'production/app/webroot/libs';
//var deploy_libs_path = 'deploy/libs';

//CleanCSS
gulp.task('cleanCSS', function() {
  return (del(production_css_path));
});

//CleanJS
//gulp.task('cleanJS', function() {
//  return (del(production_js_path));
//});

//CleanLibs
//gulp.task('cleanLIBS', function() {
//  return (del(production_libs_path));
//});

//CleanALL
gulp.task('clean', gulp.parallel('cleanCSS'/*, 'cleanJS', 'cleanLIBS'*/));

//BuildCSS
gulp.task('buildCSS', function() {
  return gulp.src(frontend_css_path + '/**/*.scss')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          title: 'buildCSS',
          message: err.message
        };
      })
    }))
    .pipe(cached('buildCSS'))
    .pipe(sourceMaps.init())
    .pipe(debug({title: 'initSourceMaps'}))
    .pipe(remember('buildCSS'))
    .pipe(doSass())
    .pipe(debug({title: 'SCSS => CSS'}))
    .pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false}))
    .pipe(debug({title: 'addAutoPrefixer'}))
    .pipe(minCSS())
    .pipe(debug({title: 'minify'}))
    .pipe(sourceMaps.write())
    .pipe(debug({title: 'writeSourceMaps'}))
    .pipe(gulp.dest(production_css_path))
    .pipe(livereload());
});

//BuildJS
//gulp.task('buildJS', function() {
//  return gulp.css(frontend_js_path + "/**/*.js")
//    .pipe(plumber({
//      errorHandler: notify.onError(function(err) {
//        return {
//          title: 'buildJS',
//          message: err.message
//        };
//      })
//    }))
//    .pipe(cached('buildJS'))
//    .pipe(sourceMaps.init())
//    .pipe(debug({title: 'initSourceMaps'}))
//    .pipe(remember('buildJS'))
//    .pipe(concat('main.js'))
//    .pipe(debug({title: 'concat'}))
//    .pipe(uglify())
//    .pipe(debug({title: 'minify'}))
//    .pipe(sourceMaps.write())
//    .pipe(debug({title: 'writeSourceMaps'}))
//    .pipe(gulp.dest(production_js_path))
//    .pipe(livereload());
//});

//BuildLibs
//gulp.task('buildLIBS', function() {
//  return gulp.css(frontend_libs_path + '/**/*.{css,js}')
//    .pipe(plumber({
//      errorHandler: notify.onError(function(err) {
//        return {
//          title: 'buildLIBS',
//          message: err.message
//        };
//      })
//    }))
//    .pipe(cached('buildLIBS')) // Исключаем повторное появление одинаковых файлов
//    .pipe(remember('buildLIBS')) // Запоминаем состояние в кэш-ремембер
//    .pipe(gulpIf(('*.css'), minCSS(), uglify()))
//    .pipe(debug({title: 'minify'}))
//    .pipe(gulp.dest(production_libs_path)) // Пишем все в фронтэнд путь библиотек
//    .pipe(livereload());
//});

//BuildALL
gulp.task('build', gulp.parallel('buildCSS'/*, 'buildJS', 'buildLIBS'*/));

//Task watcher changes for all files
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(frontend_css_path + '/**/*.*', gulp.series('buildCSS'))
    .on('unlink', function(filepath) {
      remember.forget('buildCSS', path.resolve(filepath));
      delete cached.caches.buildCSS[path.resolve(filepath)];
    });
  //gulp.watch(frontend_js_path + '/**/*.*', gulp.series('buildJS'))
  //  .on('unlink', function(filepath) {
  //    remember.forget('buildJS', path.resolve(filepath));
  //    delete cached.caches.buildJS[path.resolve(filepath)];
  //  });
  //gulp.watch(frontend_libs_path + '/**/*.{css,js}', gulp.series('buildLIBS'))
  //  .on('unlink', function(filepath) {
  //    remember.forget('buildLIBS', path.resolve(filepath));
  //    delete cached.caches.buildLIBS[path.resolve(filepath)];
  //  });
  //gulp.watch(production_img_path + '/**/*.*', gulp.series('deployIMG'));
});
gulp.task('dev', gulp.series('build', 'watch'));