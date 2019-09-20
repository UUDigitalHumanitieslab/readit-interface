import * as EventEmitter from 'events';

import { src, dest, symlink, parallel, series, watch as watchApi } from 'gulp';
import browserify = require('browserify');
import vinylStream = require('vinyl-source-stream');
import vinylBuffer = require('vinyl-buffer');
import tsify = require('tsify');
import watchify = require('watchify');
import exorcist = require('exorcist');
import exposify = require('exposify');
import aliasify = require('aliasify');
import log = require('fancy-log');
import cssnano = require('cssnano');
import autoprefixer = require('autoprefixer');
import fs = require('fs');
import path = require('path');
import proxy = require('http-proxy-middleware');
import del = require('del');
import yargs = require('yargs');
import glob = require('glob');
import { JSDOM, VirtualConsole } from 'jsdom';
import loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

type LibraryProps = {
    module: string,
    browser?: string,
    global: string,
    alias?: string[],
    path?: string,
    package?: string,
    cdn: string,
};
type ExposeConfig = {
    [moduleName: string]: string,
};

// Helpers for finishing tasks that run indefinitely.
const exitController = new EventEmitter();
function signalExit() {
    exitController.emit('signal');
}
process.on('SIGINT', signalExit);
process.on('SIGTERM', signalExit);

// General configuration.
const sourceDir = `src`,
    buildDir = `dist`,
    nodeDir = `node_modules`,
    configModuleName = 'config.json',
    indexConfig = yargs.argv.config || configModuleName,
    indexTemplate = `${sourceDir}/index.hbs`,
    indexOutput = `${buildDir}/index.html`,
    specRunnerTemplate = `${sourceDir}/specRunner.hbs`,
    specRunnerOutput = `${buildDir}/specRunner.html`,
    jasminePrefix = `jasmine-core/lib/jasmine-core/`,
    imageDir = `${sourceDir}/image`,
    mainScript = `${sourceDir}/main.ts`,
    jsBundleName = `index.js`,
    jsSourceMapDest = `${buildDir}/${jsBundleName}.map`,
    jsModuleType = `commonjs`,
    tsOptions = {
        target: `es5`,
        lib: ['DOM', 'ES5', 'ES6', 'DOM.Iterable', 'ScriptHost'],
        resolveJsonModule: true,
        paths: {configModuleName: indexConfig},
        baseUrl: '.',
    },
    aliasOptions = {
        aliases: {[configModuleName]: `./${indexConfig}`},
        appliesTo: {excludeExtensions: ['.json']},
    },
    unittestBundleName = 'tests.js',
    unittestEntries = glob.sync(`${sourceDir}/**/*-test.ts`),
    reporterEntry = `${sourceDir}/terminalReporter.ts`,
    reporterBundleName = 'terminalReporter.js',
    templateRenameOptions = {extname: '.ts'},
    templateSourceGlob = `${sourceDir}/**/*-template.hbs`,
    templateOutputGlob = `${sourceDir}/**/*-template${templateRenameOptions.extname}`,
    templateModuleType = 'es6',
    templateCacheName = 'templates',
    hbsModuleTail = 'dist/handlebars.runtime',
    hbsModule = `handlebars/${hbsModuleTail}`,
    hbsKnownHelpers = {i18n: true, static: true},
    hbsGlobal = 'Handlebars',
    i18nModuleTail = 'dist/umd/i18next',
    i18nModule = `i18next/${i18nModuleTail}`,
    styleDir = `${sourceDir}/style`,
    mainStylesheet = `${styleDir}/main.sass`,
    styleSourceGlob = `${styleDir}/*.sass`,
    cssBundleName = 'index.css',
    production = yargs.argv.production || false,
    proxyConfig = yargs.argv.proxy,
    serverRoot = yargs.argv.root,
    ports = {frontend: 8080},
    unittestUrl = `http://localhost:${ports.frontend}/${specRunnerOutput}`,
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
        module: 'i18next',
        browser: i18nModule,
        global: 'i18next',
        cdn: `${cdnjsPattern}/\${filenameMin}`,
    }, {
        module: 'jsonld',
        browser: 'jsonld/dist/jsonld.min',
        global: 'jsonld',
        cdn: `${jsdelivrPattern}/dist/\${filenameMin}`,
    }],
    browserLibsRootedPaths: string[] = [],
    cdnizerConfig = {files: browserLibs.map(lib => {
        let mod = lib.module,
            browser = lib.browser || mod,
            pkg = lib.package || mod;
        return {
            file: `/**/${browser}.*`,
            package: pkg,
            cdn: lib.cdn,
        };
    })};

browserLibs.forEach(lib => {
    let browser = lib.browser || lib.module;
    lib.path = path.relative(nodeDir, require.resolve(browser));
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

function decoratedBrowserify(options) {
    return browserify(options)
        .plugin(tsify, tsOptions)
        .transform(aliasify, aliasOptions)
        .transform(exposify, {global: true});
}

const tsModules = decoratedBrowserify({
    debug: !production,
    entries: [mainScript],
    cache: {},
    packageCache: {},
});

const tsTestModules = decoratedBrowserify({
    debug: true,
    entries: unittestEntries,
    cache: {},
    packageCache: {},
});

const reporterModules = decoratedBrowserify({
    debug: true,
    entries: [reporterEntry],
    cache: {},
    packageCache: {},
});

function ifProd(stream, otherwise?) {
    return plugins['if'](production, stream, otherwise);
}

function ifNotProd(stream) {
    return plugins['if'](!production, stream);
}

export function template() {
    return src(templateSourceGlob)
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
        .pipe(dest(sourceDir));
};

function jsBundle() {
    return tsModules.bundle()
        .pipe(ifNotProd(exorcist(jsSourceMapDest)))
        .pipe(vinylStream(jsBundleName))
        .pipe(ifProd(vinylBuffer()))
        .pipe(ifProd(plugins.uglify()))
        .pipe(dest(buildDir));
}

function jsUnittest() {
    return tsTestModules.bundle()
        .pipe(vinylStream(unittestBundleName))
        .pipe(dest(buildDir));
}

export function terminalReporter() {
    return reporterModules.bundle()
        .pipe(vinylStream(reporterBundleName))
        .pipe(dest(buildDir))
        .pipe(plugins.connect.reload());
}

export const script = series(template, jsBundle);

export function style() {
    let postcssPlugins = [autoprefixer()];
    if (production) postcssPlugins.push(cssnano());
    return src(mainStylesheet)
        .pipe(ifNotProd(plugins.sourcemaps.init()))
        .pipe(plugins.sass({includePaths: [nodeDir]}))
        .pipe(plugins.postcss(postcssPlugins))
        .pipe(plugins.rename(cssBundleName))
        .pipe(ifNotProd(plugins.sourcemaps.write('.')))
        .pipe(dest(buildDir));
};

function renderHtml(template, targetDir, extraData, done) {
    fs.readFile(indexConfig, 'utf-8', function(error, data) {
        if (error) return done(error);
        src(template)
            .pipe(plugins.hb().data(JSON.parse(data)).data(extraData))
            .pipe(ifProd(plugins.cdnizer(cdnizerConfig)))
            .pipe(plugins.rename({extname: '.html'}))
            .pipe(dest(targetDir));
        return done();
    });
};

export function index(done) {
    renderHtml(indexTemplate, buildDir, {
        libs: browserLibs,
        jsBundleName,
        cssBundleName,
        production,
    }, done);
};

export function specRunner(done) {
    renderHtml(specRunnerTemplate, buildDir, {
        libs: browserLibs,
        unittestBundleName,
        reporterBundleName,
        jasminePrefix,
    }, done);
};

export const buildUnittests = parallel(specRunner, terminalReporter, series(template, jsUnittest));

export function runUnittests(done) {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('info', console.info);
    virtualConsole.on('jsdomError', console.error);
    JSDOM.fromURL(unittestUrl, {
        runScripts: 'dangerously',
        resources: 'usable',
        virtualConsole,
    }).then(jsDOM => {
        virtualConsole.on('timeEnd', () => {
            jsDOM.window.close();
            done();
        });
    });
}

export function image() {
    return src(imageDir).pipe(symlink(buildDir));
};

export const complement = parallel(style, index, image);

export const dist = parallel(script, complement);

const fullStatic = parallel(template, complement, specRunner);

export function serve(done) {
    let serverOptions: any = {
        root: serverRoot || __dirname,
        port: ports.frontend,
        name: 'frontend',
        livereload: !proxyConfig,
        fallback: indexOutput,
    };
    if (proxyConfig) {
        const proxyData = JSON.parse(fs.readFileSync(proxyConfig, 'utf-8'));
        serverOptions.middleware = (connect, connectOptions) => proxyData.map(
            ({context, options}) => proxy(context, options)
        );
    }
    plugins.connect.server(serverOptions);
    function finalize() {
        plugins.connect.serverClose();
        done();
    }
    exitController.once('stopServing', finalize);
    exitController.once('signal', finalize);
};

function stopServing(done) {
    exitController.emit('stopServing');
    done();
}

export const test = parallel(serve, series(buildUnittests, runUnittests, stopServing));

function watchBundle(bundle, task) {
    bundle.plugin(watchify);
    bundle.on('update', task);
    bundle.on('log', log);
    task();
}

export const watch = series(fullStatic, function watch(done) {
    watchBundle(tsModules, jsBundle);
    watchBundle(tsTestModules, jsUnittest);
    watchBundle(reporterModules, terminalReporter);
    watchApi(styleSourceGlob, style);
    watchApi(templateSourceGlob, template);
    watchApi([indexConfig, indexTemplate], index);
    watchApi([indexConfig, specRunnerTemplate], series(specRunner, runUnittests));
    exitController.once('signal', done);
});

export function clean() {
    return del([buildDir, templateOutputGlob]);
};

export default series(clean, parallel(watch, serve));
