import * as EventEmitter from 'events';
import { readFile, readFileSync } from 'fs';
import { relative, join } from 'path';
import { Readable } from 'stream';

import { src, dest, symlink, parallel, series, watch as watchApi } from 'gulp';
import * as vinylStream from 'vinyl-source-stream';
import * as vinylBuffer from 'vinyl-buffer';
import * as nodeSass from 'node-sass';
import * as log from 'fancy-log';
import * as exorcist from 'exorcist';
import globbedBrowserify from 'gulp-browserify-watchify-glob';
import * as loadPlugins from 'gulp-load-plugins';
const plugins = loadPlugins();
// verderop na const plugins = loadPlugins();
const sass = plugins.sass(nodeSass);


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
    indexConfig = argv['config'] || configModuleName,
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
        lib: ['DOM', 'ES5', 'ES6', 'es2020.string', 'DOM.Iterable', 'ScriptHost'],
        resolveJsonModule: true,
        paths: { configModuleName: indexConfig },
        baseUrl: '.'
    },
    aliasOptions = {
        aliases: { [configModuleName]: `./${indexConfig}` },
        appliesTo: { excludeExtensions: ['.json'] },
    },
    unittestBundleName = 'tests.js',
    unittestEntriesGlob = `${sourceDir}/**/*-test.ts`,
    reporterEntry = `${sourceDir}/terminalReporter.ts`,
    reporterBundleName = 'terminalReporter.js',
    templateRenameOptions = { extname: '.ts' },
    templateSourceGlob = `${sourceDir}/**/*-template.hbs`,
    templateOutputGlob = `${sourceDir}/**/*-template${templateRenameOptions.extname}`,
    templateModuleType = 'es6',
    templateCacheName = 'templates',
    hbsModuleTail = 'dist/handlebars.runtime',
    hbsModule = `handlebars/${hbsModuleTail}`,
    hbsKnownHelpers = { i18n: true, static: true, startsWith: true },
    hbsGlobal = 'Handlebars',
    i18nModuleTail = 'dist/umd/i18next',
    i18nModule = `i18next/${i18nModuleTail}`,
    styleDir = `${sourceDir}/style`,
    mainStylesheet = `${styleDir}/main.sass`,
    styleSourceGlob = `${styleDir}/*.sass`,
    cssBundleName = 'index.css',
    production = argv['production'] || false,
    proxyConfig = argv['proxy'],
    serverRoot = argv['root'],
    ports = { frontend: 8080 },
    jsdelivrPattern = 'https://cdn.jsdelivr.net/npm/${package}@${version}',
    unpkgPattern = 'https://unpkg.com/${package}@${version}',
    cdnjsBase = 'https://cdnjs.cloudflare.com/ajax/libs',
    cdnjsPattern = `${cdnjsBase}/\${package}/\${version}`;

// Libraries which are inserted through <script> tags rather than being bundled
// by Browserify. They will be inserted in the order shown.
const browserLibs: LibraryProps[] = [{
    module: 'jquery',
    browser: 'jquery/dist/jquery',
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
    module: 'jquery-validation',
    browser: 'jquery-validation/dist/jquery.validate.min',
    global: 'jquery-validation',
    cdn: `${cdnjsBase}/jquery-validate/\${version}/jquery.validate.min.js`,
}, {
    module: 'jquery-validation-addons',
    package: 'jquery-validation',
    browser: 'jquery-validation/dist/additional-methods.min',
    global: 'jquery-validation-addons',
    cdn: `${cdnjsBase}/jquery-validate/\${version}/additional-methods.min.js`,
}, {
    module: 'bulma-accordion',
    browser: 'bulma-accordion/dist/js/bulma-accordion.min',
    global: 'bulmaAccordion',
    cdn: `${jsdelivrPattern}/dist/js/\${filenameMin}`,
}, {
    module: 'select2',
    global: '$',
    cdn: `${cdnjsPattern}/js/\${filenameMin}`,
}],
    browserLibsRootedPaths: string[] = [],
    cdnizerConfig = {
        files: browserLibs.map(lib => {
            let mod = lib.module,
                browser = lib.browser || mod,
                pkg = lib.package || mod;
            return {
                file: `/**/${browser}.*`,
                package: pkg,
                cdn: lib.cdn,
            };
        })
    };

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

// These libraries are shipped to NPM with untranspiled ES6 code.
const problemLibs = [
    '@comunica',
    '@rdfjs',
    'dom-serializer',
    'jsonld',
    'jsonld-context-parser',
    'jsonld-streaming-parser',
    'n3',
    'rdf-canonize',
    'rdf-parse',
    'rdfa-streaming-parser',
    'rdfxml-streaming-parser',
    'relative-to-absolute-iri',
    'streamify-string',
];
const problemLibsRegex = new RegExp(`${nodeDir}/(${problemLibs.join('|')})/`);

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
    const specRunnerPort = argv['port'] || ports.frontend;
    const specRunnerOutput = `${json.staticRoot}specRunner.html`;
    const host = `localhost:${specRunnerPort}`;
    return `http://${host}${specRunnerOutput}`;
});

function decoratedBrowserify(options, constructor = browserify) {
    return (function () {
        let bundler;
        return () => bundler || (bundler = constructor(options)
            .plugin(tsify, tsOptions)
            .transform('babelify', {
                global: true,
                presets: [['@babel/env', { targets: 'defaults' }]],
                only: [problemLibsRegex],
            })
            .transform(aliasify, aliasOptions)
            .transform(exposify, { global: true })
        );
    }());
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
            require: { [hbsGlobal]: hbsModule },
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
        .pipe(plugins.changed(buildDir, { extension: '.js' }))
        .pipe(through2.obj(function (chunk, enc, cb) {
            reporterModules().bundle()
                .on('error', reportBundleError)
                .pipe(vinylStream(reporterBundleName))
                .pipe(dest(buildDir))
                .pipe(this);
            cb();
        }));
}

export const script = series(template, jsBundle);
export const unittest = series(template, jsUnittest);
export const typecheck = series(template, parallel(jsBundle, jsUnittest));

export function style() {
    let postcssPlugins = [autoprefixer()];
    if (production) postcssPlugins.push(cssnano());
    return src(mainStylesheet)
        .pipe(ifNotProd(plugins.sourcemaps.init()))
        .pipe(sass({ includePaths: [nodeDir] }))
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
            .pipe(plugins.rename({ extname: '.html' }))
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
        cssBundleName,
        production,
    });
};

export const specRunner = (function () {
    let runnerPromise;

    function specRunner() {
        return runnerPromise = renderHtml(specRunnerTemplate, buildDir, {
            libs: browserLibs,
            unittestBundleName,
            reporterBundleName,
            jasminePrefix,
        });
    }

    function get(cb) {
        (runnerPromise || specRunner()).then(cb);
    }

    return { render: specRunner, get };
}());

export function image() {
    return src(imageDir).pipe(symlink(buildDir));
};

const complement = parallel(style, index, image);

export const dist = parallel(script, complement);

const fullStatic = parallel(template, complement, specRunner.render);

const buildUnittests = parallel(
    image, terminalReporter, unittest, specRunner.render
);

export function runUnittests(done) {
    specRunner.get(runner => {
        const virtualConsole = new VirtualConsole();
        virtualConsole.on('info', console.info);
        virtualConsole.on('log', console.log);
        virtualConsole.on('debug', console.debug);
        virtualConsole.on('jsdomError', console.error);
        const jsDOM = new JSDOM(runner.contents.toString(), {
            url: `http://localhost:${argv['port'] || ports.frontend}`,
            runScripts: 'dangerously',
            resources: 'usable',
            virtualConsole,
        });
        virtualConsole.on('timeEnd', done);
    });
}

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
            ({ context, options }) => proxy(context, options)
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
    return adoptName(inputTask, function () {
        return inputTask().pipe(plugins.connect.reload());
    });
}

function streamFromPromise(promise) {
    const stream = new Readable({ objectMode: true, read() { } });
    promise.then(result => {
        stream.push(result);
        stream.push(null);
    }, error => stream.emit('error', error));
    return stream;
}

function reloadPr(inputTask) {
    return adoptName(inputTask, function () {
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
    retest(parallel(startTestBundle, terminalReporter))();

    const styleWatch = watchApi(styleSourceGlob, reload(style));
    const templateWatch = watchApi(templateSourceGlob, template);
    const indexWatch = watchApi([indexConfig, indexTemplate], reloadPr(index));
    const specWatch = watchApi(
        [indexConfig, specRunnerTemplate],
        retest(reloadPr(specRunner.render))
    );

    exitController.once('signal', () => {
        [
            tsModules(), tsTestModules(), reporterModules(), styleWatch,
            templateWatch, indexWatch, specWatch,
        ].forEach(watcher => watcher.close());
        done();
    });
});

export const watchNoTest = series(fullStatic, function watch(done) {
    watchBundle(tsModules(), reload(jsBundle));
    watchBundle(tsTestModules(), reload(jsUnittest));

    jsBundle();
    jsUnittest();

    const styleWatch = watchApi(styleSourceGlob, reload(style));
    const templateWatch = watchApi(templateSourceGlob, template);
    const indexWatch = watchApi([indexConfig, indexTemplate], reloadPr(index));
    const specWatch = watchApi(
        [indexConfig, specRunnerTemplate],
        specRunner.render
    );

    exitController.once('signal', () => {
        [
            tsModules(), tsTestModules(), styleWatch,
            templateWatch, indexWatch, specWatch,
        ].forEach(watcher => watcher.close());
        done();
    });
});

export function clean() {
    return del([
        `${buildDir}/**`,
        `!${buildDir}`,
        `!${buildDir}/${reporterBundleName}`,
        templateOutputGlob,
    ]);
};

export const docker = series(clean, terminalReporter, watchNoTest);

export default series(clean, parallel(watch, serve));
