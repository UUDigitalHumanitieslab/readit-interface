import gulp = require('gulp');
import browserify = require('browserify');
import vinylStream = require('vinyl-source-stream');
import vinylBuffer = require('vinyl-buffer');
import tsify = require('tsify');
import watchify = require('watchify');
import log = require('fancy-log');
import cssnano = require('cssnano');
import autoprefixer = require('autoprefixer');
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

function jsbundle(modules, optimize = false) {
    return function() {
        const base = modules.bundle().pipe(vinylStream('bundle.js'));
        if (optimize) {
            return base.pipe(vinylBuffer()).pipe(plugins.uglify()).pipe(gulp.dest('dist'));
        } else {
            return base.pipe(gulp.dest('build'));
        }
    };
}

function style(optimize = false) {
    let postcssPlugins = [autoprefixer()];
    if (optimize) postcssPlugins.push(cssnano());
    let stream = gulp.src('style/main.sass');
    if (!optimize) stream = stream.pipe(plugins.sourcemaps.init());
    stream = stream.pipe(plugins.sass({includePaths: ['node_modules']}))
        .pipe(plugins.postcss(postcssPlugins));
    if (!optimize) stream = stream.pipe(plugins.sourcemaps.write('.'));
    return stream;
}

gulp.task('bundle', jsbundle(tsModules));

gulp.task('bundle-dist', jsbundle(tsModules, true));

gulp.task('sass', function() {
    return style().pipe(gulp.dest('build'));
});

gulp.task('sass:dist', function() {
    return style(true).pipe(gulp.dest('dist'));
});

gulp.task('watch', ['sass'], function() {
    const tsModulesWatched = tsModules.plugin(watchify);
    const bundleWatched = jsbundle(tsModulesWatched);
    tsModulesWatched.on('update', bundleWatched);
    tsModulesWatched.on('log', log);
    bundleWatched();
    gulp.watch('style/*.sass', ['sass']);
});

gulp.task('default', function() {
    // TODO
});
