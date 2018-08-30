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
import streamqueue = require('streamqueue');
import del = require('del');
import yargs = require('yargs');
import glob = require('glob');
import loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

type LibraryProps = {
    module: string,
    global: string,
    alias?: string[],
    path?: string,
    package?: string,
    cdn: string,
};
type ExposeConfig = {
    [moduleName: string]: string,
};

// Task names.
const SCRIPT = 'script',
    UNITTEST = 'unittest',
    STYLE = 'style',
    TEMPLATE = 'template',
    INDEX = 'index',
    DIST = 'dist',
    WATCH = 'watch',
    CLEAN = 'clean';

// General configuration.
const sourceDir = `src`,
    buildDir = `dist`,
    nodeDir = `node_modules`,
    mainScript = `${sourceDir}/main.ts`,
    jsBundleName = `index.js`,
    jsSourceMapDest = `${buildDir}/${jsBundleName}.map`,
    jsTargetVersion = `es5`,
    jsModuleType = `commonjs`,
    tsLibs = ['DOM', 'ES5', 'ES6', 'DOM.Iterable', 'ScriptHost'],
    unittestBundleName = 'tests.js',
    unittestEntries = glob.sync(`${sourceDir}/**/*-test.ts`),
    templateRenameOptions = {extname: '.ts'},
    templateSourceGlob = `${sourceDir}/**/*-template.hbs`,
    templateOutputGlob = `${sourceDir}/**/*-template${templateRenameOptions.extname}`,
    templateModuleType = 'es6',
    templateCacheName = 'templates',
    hbsModuleTail = 'dist/handlebars.runtime',
    hbsModule = `handlebars/${hbsModuleTail}`,
    hbsKnownHelpers = {i18n: true},
    hbsGlobal = 'Handlebars',
    i18nModuleTail = 'dist/umd/i18next',
    i18nModule = `i18next/${i18nModuleTail}`,
    styleDir = `${sourceDir}/style`,
    mainStylesheet = `${styleDir}/main.sass`,
    styleSourceGlob = `${styleDir}/*.sass`,
    cssBundleName = 'index.css',
    indexConfig = yargs.argv.config || `config.json`,
    indexTemplate = `${sourceDir}/index.hbs`,
    livereloadTargets = `${buildDir}/**`,
    production = yargs.argv.production || false,
    jsdelivrPattern = 'https://cdn.jsdelivr.net/npm/${package}@${version}',
    unpkgPattern = 'https://unpkg.com/${package}@${version}',
    cdnjsBase = 'https://cdnjs.cloudflare.com/ajax/libs',
    cdnjsPattern = `${cdnjsBase}/\${package}/\${version}`;

// Libraries which are inserted through <script> tags rather than being bundled
// by Browserify. They will be inserted in the order shown.
const browserLibs: LibraryProps[] = [{
        module: 'jquery',
        global: '$',
        cdn: `${cdnjsPattern}/\${filenameMin}`,
    }, {
        module: 'lodash',
        global: '_',
        alias: ['underscore'],
        cdn: `${jsdelivrPattern}/\${filenameMin}`,
    }, {
        module: 'backbone',
        global: 'Backbone',
        cdn: `${cdnjsBase}/backbone.js/\${version}/backbone-min.js`,
    }, {
        module: hbsModule,
        global: hbsGlobal,
        package: 'handlebars',
        cdn: `${jsdelivrPattern}/${hbsModuleTail}.min.js`,
    }, {
        module: i18nModule,
        global: 'i18next',
        package: 'i18next',
        cdn: `${unpkgPattern}/${i18nModuleTail}.min.js`,
    }],
    browserLibsRootedPaths: string[] = [],
    cdnizerConfig = {files: browserLibs.map(lib => {
        let pkg = lib.package || lib.module;
        return {
            file: `/**/${pkg}/**`,
            package: pkg,
            cdn: lib.cdn,
        };
    })};

browserLibs.forEach(lib => {
    lib.path = path.relative(nodeDir, require.resolve(lib.module));
    browserLibsRootedPaths.push(path.join(nodeDir, lib.path));
});

// We override the filePattern (normally /\.js$/) because tsify
// outputs files without an extension. Basically, we tell exposify to
// not be picky. This is fine because we only feed JS files into
// browserify anyway.
exposify.filePattern = /./;
exposify.config = browserLibs.reduce((config: ExposeConfig, lib) => {
    config[lib.module] = lib.global;
    if (lib.alias) lib.alias.forEach(alias => config[alias] = lib.global);
    return config;
}, {});

const tsModules = browserify({
    debug: !production,
    entries: [mainScript],
    cache: {},
    packageCache: {},
}).plugin(tsify, {
    target: jsTargetVersion,
    lib: tsLibs,
}).transform(exposify);

const tsTestModules = browserify({
    entries: unittestEntries,
    cache: {},
    packageCache: {},
}).plugin(tsify, {
    target: jsTargetVersion,
    lib: tsLibs,
}).transform(exposify);

function ifProd(stream, otherwise?) {
    return plugins['if'](production, stream, otherwise);
}

function ifNotProd(stream) {
    return plugins['if'](!production, stream);
}

function jsBundle() {
    return tsModules.bundle()
        .pipe(ifNotProd(exorcist(jsSourceMapDest)))
        .pipe(vinylStream(jsBundleName))
        .pipe(ifProd(vinylBuffer()))
        .pipe(ifProd(plugins.uglify()))
        .pipe(gulp.dest(buildDir));
}

function jsUnittest() {
    const libs = gulp.src(browserLibsRootedPaths);
    const bundle = tsTestModules.bundle()
        .pipe(vinylStream(unittestBundleName))
        .pipe(vinylBuffer());
    return streamqueue({objectMode: true}, libs, bundle)
        .pipe(plugins.jasmineBrowser.specRunner({console: true}))
        .pipe(plugins.jasmineBrowser.headless({
            driver: 'phantomjs',
            port: 8088,
        }));
}

gulp.task(SCRIPT, [TEMPLATE], jsBundle);

gulp.task(UNITTEST, [TEMPLATE], jsUnittest);

gulp.task(STYLE, function() {
    let postcssPlugins = [autoprefixer()];
    if (production) postcssPlugins.push(cssnano());
    return gulp.src(mainStylesheet)
        .pipe(ifNotProd(plugins.sourcemaps.init()))
        .pipe(plugins.sass({includePaths: [nodeDir]}))
        .pipe(plugins.postcss(postcssPlugins))
        .pipe(plugins.rename(cssBundleName))
        .pipe(ifNotProd(plugins.sourcemaps.write('.')))
        .pipe(gulp.dest(buildDir));
});

gulp.task(TEMPLATE, function() {
    return gulp.src(templateSourceGlob)
        .pipe(plugins.cached(templateCacheName))
        .pipe(plugins.handlebars({
            compilerOptions: {
                knownHelpers: hbsKnownHelpers,
                knownHelpersOnly: true,
            },
        }))
        .pipe(plugins.defineModule(templateModuleType, {
            require: {[hbsGlobal]: hbsModule},
        }))
        .pipe(plugins.rename(templateRenameOptions))
        .pipe(gulp.dest(sourceDir));
});

gulp.task(INDEX, function(done) {
    fs.readFile(indexConfig, 'utf-8', function(error, data) {
        if (error) return done(error);
        gulp.src(indexTemplate)
            .pipe(plugins.hb().data(JSON.parse(data)).data({
                libs: browserLibs,
                jsBundleName,
                cssBundleName,
                production,
            }))
            .pipe(ifProd(plugins.cdnizer(cdnizerConfig)))
            .pipe(plugins.rename({extname: '.html'}))
            .pipe(gulp.dest(buildDir));
        return done();
    });
});

gulp.task(DIST, [SCRIPT, STYLE, INDEX]);

gulp.task(WATCH, [STYLE, TEMPLATE, INDEX], function(callback) {
    tsModules.plugin(watchify);
    tsModules.on('update', jsBundle);
    tsModules.on('log', log);
    jsBundle();
    tsTestModules.plugin(watchify);
    tsTestModules.on('update', jsUnittest);
    jsUnittest();
    plugins.livereload.listen();
    gulp.watch(styleSourceGlob, [STYLE]);
    gulp.watch(templateSourceGlob, [TEMPLATE]);
    gulp.watch([indexConfig, indexTemplate], [INDEX]);
    gulp.watch(livereloadTargets).on('change', plugins.livereload.changed);
});

gulp.task(CLEAN, function() {
    return del([buildDir, templateOutputGlob]);
});

gulp.task('default', [CLEAN], function() {
    gulp.start(WATCH);
});
