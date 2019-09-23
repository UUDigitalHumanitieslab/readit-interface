import { series, watch as watchApi } from 'gulp';

import * as browserify from 'browserify';
import * as watchify from 'watchify';

import * as glob from 'glob';
import { defaults, isArray, reduce, head, tail } from 'lodash';

// Long event name to avoid conflicts.
const updateSafe = 'gulp-watchify-glob-bundle-done';
const baseOptions = {
    cache: {},
    packageCache: {},
};
const globOptions = {absolute: true};

function accumulateEntriesSync(accumulator, pattern) {
    return accumulator.concat(glob.sync(pattern, globOptions));
}

function expandGlobsSync(patterns) {
    return reduce(patterns, accumulateEntriesSync, []);
}

function expandGlobs(patterns, done, accumulator = []) {
    const pattern = head(patterns);
    if (!pattern) return done(null, accumulator);
    glob(pattern, globOptions, (error, paths) => {
        if (error) return done(error);
        expandGlobs(tail(patterns), done, accumulator.concat(paths));
    });
}

function difference<T>(left: Set<T>, right: Set<T>): Set<T> {
    const diff = new Set<T>();
    left.forEach(item => right.has(item) || diff.add(item));
    return diff;
}

function updateEntries(entriesGlob, entries, bundler, done) {
    expandGlobs(entriesGlob, (error, paths) => {
        if (error) return done(error);
        // The following logic relies on browserify implementation details.
        const oldEntries = new Set(entries);
        const newEntries = new Set(paths);
        const added = difference(newEntries, oldEntries);
        const removed = difference(oldEntries, newEntries);
        const recorded = bundler._recorded;
        bundler.reset();
        const pipeline = bundler.pipeline;
        added.forEach(path => bundler.add(path));
        recorded.forEach(row => {
            if (removed.has(row.file)) return;
            if (row.entry) row.order = bundler._entryOrder++;
            pipeline.write(row);
        });
        entries.splice(0);
        entries.splice(0, 0, ...paths);
        done(error, entries);
    });
}

export default function globbedBrowserify(options) {
    let entriesGlob = options.entries;
    if (!entriesGlob) throw TypeError('globbedBrowserify needs entries');
    if (!isArray(entriesGlob)) entriesGlob = [entriesGlob];
    const entries = expandGlobsSync(entriesGlob);
    const bundler = new browserify(defaults({entries}, options, baseOptions));
    let bundling = false;
    let entriesChanged = false;

    function beforeBundling(done) {
        bundling = true;
        if (entriesChanged) {
            entriesChanged = false;
            updateEntries(entriesGlob, entries, bundler, done);
        } else {
            done();
        }
    }

    function afterBundling(done) {
        bundling = false;
        bundler.emit(updateSafe);
        done();
    }

    function triggerBundle(done) {
        entriesChanged = true;
        if (bundling) {
            bundler.once(updateSafe, () => emitUpdate(done));
        } else {
            emitUpdate(done);
        }
    }

    function emitUpdate(done) {
        bundler.emit('update');
        done();
    }

    function wrapTask(task) {
        return series(beforeBundling, task, afterBundling);
    }

    function watch(task, kickoffTask = task) {
        bundler.plugin(watchify);
        bundler.on('update', wrapTask(task));

        watchApi(entriesGlob, {
            events: ['add', 'unlink'],
            cwd: process.cwd(),
        }, triggerBundle);

        return wrapTask(kickoffTask);
    }

    bundler.watch = watch;
    bundler.wrap = wrapTask;
    return bundler;
}
