import gulp = require('gulp');
import browserify = require('browserify');
import vinylStream = require('vinyl-source-stream');
import vinylBuffer = require('vinyl-buffer');
import tsify = require('tsify');
import watchify = require('watchify');
import exorcist = require('exorcist');
import log = require('fancy-log');
import cssnano = require('cssnano');
import autoprefixer = require('autoprefixer');
import hbsfy = require('hbsfy');
import loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

function tsModules(debug = true) {
    return browserify({
        debug: debug,
        entries: ['src/main.ts'],
        cache: {},
        packageCache: {},
        extensions: ['hbs'],
    }).plugin(tsify, {
        target: 'es5',
    }).transform(hbsfy);
}

function jsbundle(modules, optimize = false) {
    if (optimize) return function() {
        return modules.bundle()
            .pipe(vinylStream('bundle.js'))
            .pipe(vinylBuffer())
            .pipe(plugins.uglify())
            .pipe(gulp.dest('dist'));
    }; else return function() {
        return modules.bundle()
            .pipe(exorcist('build/bundle.js.map'))
            .pipe(vinylStream('bundle.js'))
            .pipe(gulp.dest('build'));
    };
}

function style(optimize = false) {
    let postcssPlugins = [autoprefixer()];
    if (optimize) postcssPlugins.push(cssnano());
    let stream = gulp.src('src/style/main.sass');
    if (!optimize) stream = stream.pipe(plugins.sourcemaps.init());
    stream = stream.pipe(plugins.sass({includePaths: ['node_modules']}))
        .pipe(plugins.postcss(postcssPlugins));
    if (!optimize) stream = stream.pipe(plugins.sourcemaps.write('.'));
    return stream;
}

gulp.task('ts', jsbundle(tsModules()));

gulp.task('ts:dist', jsbundle(tsModules(false), true));

gulp.task('sass', function() {
    return style().pipe(gulp.dest('build'));
});

gulp.task('sass:dist', function() {
    return style(true).pipe(gulp.dest('dist'));
});

// gulp.task('hbs', function() {
//     return gulp.src('src/**/*-template.hbs')
//         .pipe(plugins.handlebars())
//         .pipe(plugins.defineModule('es6'))
//         .pipe(gulp.dest('src'));
// });

gulp.task('watch', ['sass'], function() {
    const tsModulesWatched = tsModules().plugin(watchify);
    const bundleWatched = jsbundle(tsModulesWatched);
    tsModulesWatched.on('update', bundleWatched);
    tsModulesWatched.on('log', log);
    bundleWatched();
    gulp.watch('src/style/*.sass', ['sass']);
});

gulp.task('default', function() {
    // TODO
});
