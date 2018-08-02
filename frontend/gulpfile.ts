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
import del = require('del');
import yargs = require('yargs');
import loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

const sourceDir = 'src',
    buildDir = 'build',
    distDir = 'dist',
    nodeDir = 'node_modules',
    mainScript = `${sourceDir}/main.ts`,
    jsBundleName = 'bundle.js',
    jsSourceMapDest = `${buildDir}/bundle.js.map`,
    jsTargetVersion = 'es5',
    jsModuleType = 'commonjs',
    templateSourceGlob = `${sourceDir}/**/*-template.hbs`,
    templateOutputGlob = `${sourceDir}/**/*-template.js`,
    styleDir = `${sourceDir}/style`,
    mainStylesheet = '${styleDir}/main.sass',
    styleSourceGlob = '${styleDir}/*.sass';

function tsModules(debug = true) {
    return browserify({
        debug: debug,
        entries: [mainScript],
        cache: {},
        packageCache: {},
    }).plugin(tsify, {
        target: jsTargetVersion,
    });
}

function jsbundle(modules, optimize = false) {
    if (optimize) return function() {
        return modules.bundle()
            .pipe(vinylStream(jsBundleName))
            .pipe(vinylBuffer())
            .pipe(plugins.uglify())
            .pipe(gulp.dest(distDir));
    }; else return function() {
        return modules.bundle()
            .pipe(exorcist(jsSourceMapDest))
            .pipe(vinylStream(jsBundleName))
            .pipe(gulp.dest(buildDir));
    };
}

function style(optimize = false) {
    let postcssPlugins = [autoprefixer()];
    if (optimize) postcssPlugins.push(cssnano());
    let stream = gulp.src(mainStylesheet);
    if (!optimize) stream = stream.pipe(plugins.sourcemaps.init());
    stream = stream.pipe(plugins.sass({includePaths: [nodeDir]}))
        .pipe(plugins.postcss(postcssPlugins));
    if (!optimize) stream = stream.pipe(plugins.sourcemaps.write('.'));
    return stream;
}

gulp.task('ts', ['hbs'], jsbundle(tsModules()));

gulp.task('ts:dist', ['hbs'], jsbundle(tsModules(false), true));

gulp.task('sass', function() {
    return style().pipe(gulp.dest(buildDir));
});

gulp.task('sass:dist', function() {
    return style(true).pipe(gulp.dest(distDir));
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
        .pipe(gulp.dest('src'));
});

gulp.task('index', function() {
    const config = yargs.argv.config || 'config.json';
    log(yargs.argv.config);
    log(config);
    const hbsTransform = plugins.hb().data(config);
    return gulp.src('src/index.hbs')
    .pipe(hbsTransform)
    .pipe(gulp.dest(buildDir));
});

gulp.task('watch', ['sass', 'hbs'], function() {
    const tsModulesWatched = tsModules().plugin(watchify);
    const bundleWatched = jsbundle(tsModulesWatched);
    tsModulesWatched.on('update', bundleWatched);
    tsModulesWatched.on('log', log);
    bundleWatched();
    gulp.watch(styleSourceGlob, ['sass']);
    gulp.watch(templateSourceGlob, ['hbs']);
});

gulp.task('clean', function() {
    return del([buildDir, distDir, templateOutputGlob]);
});

gulp.task('default', function() {
    // TODO
});
