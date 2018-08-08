import gulp = require('gulp');
import browserify = require('browserify');
import vinylStream = require('vinyl-source-stream');
import vinylBuffer = require('vinyl-buffer');
import tsify = require('tsify');
import watchify = require('watchify');
import exorcist = require('exorcist');
import exposify = require('exposify');
import log = require('fancy-log');
import cssnano = require('cssnano');
import autoprefixer = require('autoprefixer');
import fs = require('fs');
import path = require('path');
import del = require('del');
import yargs = require('yargs');
import loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

const sourceDir = `src`,
    buildDir = `dist`,
    nodeDir = `node_modules`,
    mainScript = `${sourceDir}/main.ts`,
    jsBundleName = `bundle.js`,
    jsSourceMapDest = `${buildDir}/bundle.js.map`,
    jsTargetVersion = `es5`,
    jsModuleType = `commonjs`,
    templateSourceGlob = `${sourceDir}/**/*-template.hbs`,
    templateOutputGlob = `${sourceDir}/**/*-template.js`,
    styleDir = `${sourceDir}/style`,
    mainStylesheet = `${styleDir}/main.sass`,
    styleSourceGlob = `${styleDir}/*.sass`,
    indexConfig = yargs.argv.config || `config.json`,
    indexTemplate = `${sourceDir}/index.hbs`,
    production = yargs.argv.production || false,
    browserLibs = {
        jquery: '$',
        lodash: '_',
        underscore: '_',
        backbone: 'Backbone',
        'handlebars/runtime': 'Handlebars',
    }, localBrowerLibs = Object.keys(browserLibs).map(
        lib => path.relative(buildDir, require.resolve(lib))
    );

// We override the filePattern (normally /\.js$/) because tsify
// outputs files without an extension. Basically, we tell exposify to
// not be picky. This is fine because we only feed JS files into
// browserify anyway.
exposify.filePattern = /./;
exposify.config = browserLibs;

const tsModules = browserify({
    debug: !production,
    entries: [mainScript],
    cache: {},
    packageCache: {},
}).plugin(tsify, {
    target: jsTargetVersion,
}).transform(exposify);

function ifProd(stream, otherwise?) {
    return plugins['if'](production, stream, otherwise);
}

function ifNotProd(stream) {
    return plugins['if'](!production, stream);
}

function jsbundle(modules) {
    return function() {
        return modules.bundle()
            .pipe(ifNotProd(exorcist(jsSourceMapDest)))
            .pipe(vinylStream(jsBundleName))
            .pipe(ifProd(vinylBuffer()))
            .pipe(ifProd(plugins.uglify()))
            .pipe(gulp.dest(buildDir));
    };
}

gulp.task('ts', ['hbs'], jsbundle(tsModules));

gulp.task('sass', function() {
    let postcssPlugins = [autoprefixer()];
    if (production) postcssPlugins.push(cssnano());
    return gulp.src(mainStylesheet)
        .pipe(ifNotProd(plugins.sourcemaps.init()))
        .pipe(plugins.sass({includePaths: [nodeDir]}))
        .pipe(plugins.postcss(postcssPlugins))
        .pipe(ifNotProd(plugins.sourcemaps.write('.')))
        .pipe(gulp.dest(buildDir));
});

gulp.task('hbs', function() {
    return gulp.src(templateSourceGlob)
        .pipe(plugins.handlebars({
            compilerOptions: {
                knownHelpers: {},
                knownHelpersOnly: true,
            },
        }))
        .pipe(plugins.defineModule(jsModuleType, {
            require: {Handlebars: 'handlebars/runtime'},
        }))
        .pipe(gulp.dest(sourceDir));
});

gulp.task('index', function(done) {
    fs.readFile(indexConfig, 'utf-8', function(error, data) {
        if (error) return done(error);
        gulp.src(indexTemplate)
            .pipe(plugins.hb().data(JSON.parse(data)))
            .pipe(plugins.rename({extname: '.html'}))
            .pipe(gulp.dest(buildDir));
        return done();
    });
});

gulp.task('watch', ['sass', 'hbs', 'index'], function() {
    const tsModulesWatched = tsModules.plugin(watchify);
    const bundleWatched = jsbundle(tsModulesWatched);
    tsModulesWatched.on('update', bundleWatched);
    tsModulesWatched.on('log', log);
    bundleWatched();
    gulp.watch(styleSourceGlob, ['sass']);
    gulp.watch(templateSourceGlob, ['hbs']);
    gulp.watch([indexConfig, indexTemplate], ['index']);
});

gulp.task('clean', function() {
    return del([buildDir, templateOutputGlob]);
});

gulp.task('default', function() {
    // TODO
});
