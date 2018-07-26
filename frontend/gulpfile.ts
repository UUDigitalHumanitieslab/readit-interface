import gulp = require('gulp');
import browserify = require('browserify');
import vinylStream = require('vinyl-source-stream');
import vinylBuffer = require('vinyl-buffer');
import tsify = require('tsify');
import watchify = require('watchify');
import log = require('fancy-log');
import loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

const tsModules = browserify({
    debug: true,
    entries: ['main.ts'],
    cache: {},
    packageCache: {},
}).plugin(tsify, {
    target: 'es5',
});

function bundle(modules, optimize = false) {
    return function() {
        const base = modules.bundle().pipe(vinylStream('bundle.js'));
        if (optimize) {
            return base.pipe(vinylBuffer()).pipe(plugins.uglify()).pipe(gulp.dest('dist'));
        } else {
            return base.pipe(gulp.dest('build'));
        }
    };
}

gulp.task('bundle', bundle(tsModules));

gulp.task('bundle-dist', bundle(tsModules, true));

gulp.task('watch', function() {
    const tsModulesWatched = tsModules.plugin(watchify);
    const bundleWatched = bundle(tsModulesWatched);
    tsModulesWatched.on('update', bundleWatched);
    tsModulesWatched.on('log', log);
    bundleWatched();
});

gulp.task('default', function() {
    // TODO
});
