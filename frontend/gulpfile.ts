import * as EventEmitter from 'events';
import { readFile, readFileSync } from 'fs';
import { relative, join } from 'path';
import { Readable } from 'stream';

import { src, dest, symlink, parallel, series, watch as watchApi } from 'gulp';
import * as vinylStream from 'vinyl-source-stream';
import * as vinylBuffer from 'vinyl-buffer';
import * as log from 'fancy-log';
import * as exorcist from 'exorcist';
import globbedBrowserify from 'gulp-browserify-watchify-glob';
import * as loadPlugins from 'gulp-load-plugins';
const plugins = loadPlugins();

import * as browserify from 'browserify';
import * as tsify from 'tsify';
import * as watchify from 'watchify';
import * as exposify from 'exposify';
import * as aliasify from 'aliasify';

import * as cssnano from 'cssnano';
import * as autoprefixer from 'autoprefixer';
import * as proxy from 'http-proxy-middleware';
import * as del from 'del';
import { argv } from 'yargs';
import { JSDOM, VirtualConsole } from 'jsdom';
import * as through2 from 'through2';
import chalk from 'chalk';

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
    indexConfig = argv.config || configModuleName,
    indexTemplate = `${sourceDir}/index.hbs`,
    indexOutput = `${buildDir}/index.html`,
    specRunnerTemplate = `${sourceDir}/specRunner.hbs`,
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
    unittestEntriesGlob = `${sourceDir}/**/*-test.ts`,
    reporterEntry = `${sourceDir}/terminalReporter.ts`,
    reporterBundleName = 'terminalReporter.js',
    vendorBundleName = 'vendor.js',
    vendorSourceMapDest = `${buildDir}/${vendorBundleName}.map`,
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
    production = argv.production || false,
    proxyConfig = argv.proxy,
    serverRoot = argv.root,
    ports = {frontend: 8080},
    jsdelivrPattern = 'https://cdn.jsdelivr.net/npm/${package}@${version}',
    unpkgPattern = 'https://unpkg.com/${package}@${version}',
    cdnjsBase = 'https://cdnjs.cloudflare.com/ajax/libs',
    cdnjsPattern = `${cdnjsBase}/\${package}/\${version}`;

// Modules which are bundled separately in the vendor.js. Add a node
// module to this list if it isn't browser-ready, i.e., it (a) needs
// a Babel transform and (b) is for whatever reason impractical to
// use as a browserLib (see next constant), for example because we
// import both the top module and specific submodules as in the case of jsonld.
const vendorLibs = [
    'jsonld/lib/util',
    'jsonld/lib/constants',
    'jsonld/lib/JsonLdError',
    'rdf-parse',
];

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
    }, {
        module: 'bulma-accordion',
        browser: 'bulma-accordion/dist/js/bulma-accordion.min.js',
        global: 'bulmaAccordion',
        cdn: `${jsdelivrPattern}/dist/js/\${filenameMin}`,
    }, {
        module: 'jquery-validation',
        browser: 'jquery-validation/dist/jquery.validate.min.js',
        global: 'jquery-validation',
        cdn: `${jsdelivrPattern}/dist/js/\${filenameMin}`,
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
    lib.path = relative(nodeDir, require.resolve(browser));
    browserLibsRootedPaths.push(join(nodeDir, lib.path));
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

const configJSON: Promise<any> = new Promise((resolve, reject) => {
    readFile(indexConfig, 'utf-8', (error, data) => {
        if (error) {
            reject(error);
        } else {
            resolve(JSON.parse(data));
        }
    });
});

const unittestUrl = configJSON.then(json => {
    const specRunnerPort = argv.port || ports.frontend;
    const specRunnerOutput = `${json.staticRoot}specRunner.html`;
    const host = `localhost:${specRunnerPort}`;
    return `http://${host}${specRunnerOutput}`;
});

function lazyInit(initialize: () => any) {
    let value;
    return () => value || (value = initialize());
}

function decoratedBrowserify(options, constructor = browserify) {
    return lazyInit(() => constructor(options)
        .external(vendorModules())
        .plugin(tsify, tsOptions)
        .transform(aliasify, aliasOptions)
        .transform(exposify, {global: true})
    );
}

const tsModules = decoratedBrowserify({
    debug: !production,
    entries: [mainScript],
    cache: {},
    packageCache: {},
});

const tsTestModules = decoratedBrowserify({
    debug: true,
    entries: unittestEntriesGlob,
}, globbedBrowserify);

const reporterModules = decoratedBrowserify({
    debug: true,
    entries: [reporterEntry],
    cache: {},
    packageCache: {},
});

const vendorModules = lazyInit(() => browserify({
        debug: !production,
        require: vendorLibs,
        fullPaths: true,
    }).transform('babelify', {
        global: true,
        presets: [['@babel/env', { targets: "defaults" }]],
        only: [/\/node_modules\/(jsonld|rdf-parse)\//],
    }).transform(aliasify, aliasOptions).transform(exposify, {global: true})
);

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

function reportBundleError(errorObj) {
    log.error(chalk.red(errorObj.message));
}

function jsBundle() {
    return tsModules().bundle()
        .on('error', reportBundleError)
        .pipe(ifNotProd(exorcist(jsSourceMapDest)))
        .pipe(vinylStream(jsBundleName))
        .pipe(ifProd(vinylBuffer()))
        .pipe(ifProd(plugins.uglify()))
        .pipe(dest(buildDir));
}

function jsUnittest() {
    return tsTestModules().bundle()
        .on('error', reportBundleError)
        .pipe(vinylStream(unittestBundleName))
        .pipe(dest(buildDir));
}

export function terminalReporter() {
    return src(reporterEntry)
        .pipe(plugins.changed(buildDir, {extension: '.js'}))
        .pipe(through2.obj(function(chunk, enc, cb) {
            reporterModules().bundle()
                .on('error', reportBundleError)
                .pipe(vinylStream(reporterBundleName))
                .pipe(dest(buildDir))
                .pipe(this);
            cb();
        }));
}

function vendorBundle() {
    return vendorModules().bundle()
        .on('error', reportBundleError)
        .pipe(ifNotProd(exorcist(vendorSourceMapDest)))
        .pipe(vinylStream(vendorBundleName))
        .pipe(ifProd(vinylBuffer()))
        .pipe(ifProd(plugins.uglify()))
        .pipe(dest(buildDir));
}

export const script = series(template, vendorBundle, jsBundle);
export const unittest = series(template, vendorBundle, jsUnittest);
export const typecheck = series(template, parallel(jsBundle, jsUnittest));

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

function renderHtml(template, targetDir, extraData) {
    return new Promise((resolve, reject) => configJSON.then(
        json => src(template)
            .pipe(plugins.hb().data(json).data(extraData))
            .pipe(ifProd(plugins.cdnizer(cdnizerConfig)))
            .pipe(plugins.rename({extname: '.html'}))
            .pipe(dest(targetDir))
    ).then(
        pipe => pipe.on('data', resolve).on('error', reject),
        reject
    ));
};

export function index() {
    return renderHtml(indexTemplate, buildDir, {
        libs: browserLibs,
        jsBundleName,
        vendorBundleName,
        cssBundleName,
        production,
    });
};

export const specRunner = (function() {
    let runnerPromise;

    function specRunner() {
        return runnerPromise = renderHtml(specRunnerTemplate, buildDir, {
            libs: browserLibs,
            unittestBundleName,
            reporterBundleName,
            vendorBundleName,
            jasminePrefix,
        });
    }

    function get(cb) {
        (runnerPromise || specRunner()).then(cb);
    }

    return { render: specRunner, get };
}());

const buildUnittests = parallel(terminalReporter, vendorBundle, unittest, specRunner.render);

export function runUnittests(done) {
    specRunner.get(runner => {
        const virtualConsole = new VirtualConsole();
        virtualConsole.on('info', console.info);
        virtualConsole.on('log', console.log);
        virtualConsole.on('debug', console.debug);
        virtualConsole.on('jsdomError', console.error);
        const jsDOM = new JSDOM(runner.contents.toString(), {
            url: `http://localhost:${argv.port || ports.frontend}`,
            runScripts: 'dangerously',
            resources: 'usable',
            virtualConsole,
        });
        virtualConsole.on('timeEnd', () => {
            jsDOM.window.close();
            done();
        });
    });
}

export function image() {
    return src(imageDir).pipe(symlink(buildDir));
};

const complement = parallel(style, index, image);

export const dist = parallel(script, complement);

const fullStatic = parallel(template, complement, specRunner.render);

export function serve(done) {
    let serverOptions: any = {
        root: serverRoot || __dirname,
        port: ports.frontend,
        name: 'frontend',
        livereload: !proxyConfig,
        fallback: indexOutput,
    };
    if (proxyConfig) {
        const proxyData = JSON.parse(readFileSync(proxyConfig, 'utf-8'));
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

function adoptName(originalTask, wrappedTask) {
    wrappedTask.displayName = originalTask.displayName || originalTask.name;
    return wrappedTask;
}

function reload(inputTask) {
    return adoptName(inputTask, function() {
        return inputTask().pipe(plugins.connect.reload());
    });
}

function streamFromPromise(promise) {
    const stream = new Readable({objectMode: true, read(){}});
    promise.then(result => {
        stream.push(result);
        stream.push(null);
    }, error => stream.emit('error', error));
    return stream;
}

function reloadPr(inputTask) {
    return adoptName(inputTask, function() {
        return streamFromPromise(inputTask()).pipe(plugins.connect.reload());
    });
}

function retest(inputTask) {
    return series(inputTask, runUnittests);
}

function watchBundle(bundle, task) {
    bundle.plugin(watchify);
    bundle.on('update', task);
}

export const watch = series(fullStatic, function watch(done) {
    watchBundle(tsModules(), reload(jsBundle));
    const retestTestBundle = retest(reload(jsUnittest));
    const startTestBundle = tsTestModules().watch(retestTestBundle, jsUnittest);
    watchBundle(reporterModules(), retest(reload(terminalReporter)));

    jsBundle();
    retest(parallel(startTestBundle, terminalReporter, vendorBundle))();

    const styleWatch = watchApi(styleSourceGlob, reload(style));
    const templateWatch = watchApi(templateSourceGlob, template);
    const indexWatch = watchApi([indexConfig, indexTemplate], reloadPr(index));
    const specWatch = watchApi(
        [indexConfig, specRunnerTemplate],
        retest(reloadPr(specRunner.render))
    );

    exitController.once('signal', () => {
        [
            tsModules(), tsTestModules(), reporterModules(),
            styleWatch, templateWatch, indexWatch, specWatch,
        ].forEach(watcher => watcher.close());
        done();
    });
});

export function clean() {
    return del([
        `${buildDir}/**`,
        `!${buildDir}`,
        `!${buildDir}/${reporterBundleName}`,
        `!${buildDir}/${vendorBundleName}`,
        templateOutputGlob,
    ]);
};

export default series(clean, parallel(watch, serve));
