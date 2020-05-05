import '@dhl-uu/jquery-promise';
import 'jasmine-ajax';

import { extend } from 'lodash';
import { Events } from 'backbone';

import Store from './jsonld/store';
import './global/hbsHelpers';
import { i18nPromise } from './global/i18n';

/**
 * Helper to make the `name` event on `emitter` `await`-able.
 * Caveat: only resolves if the event triggers *after* you call this function.
 */
export function event(emitter: Events, name: string): Promise<void> {
    return new Promise(resolve => emitter.once(name, resolve));
}

/**
 * Helper to make a timeout `await`-able.
 */
export function timeout(milliseconds): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Wrap the following functions in beforeEach() and afterEach(),
 * respectively, to use a store in all tests of a suite.
 */
export function startStore() {
    jasmine.Ajax.install();
    this._globalGraph = new Store();
}
export function endStore() {
    this._globalGraph.off().stopListening().stopReplying().reset();
    delete this._globalGraph;
    jasmine.Ajax.uninstall();
}

/**
 * Wrap this in a beforeAll() to enable i18n in all tests of a suite.
 */
export function enableI18n() {
    return i18nPromise;
}

/**
 * Invoke jasmine.Ajax.addCustomParamParser(JSONLDParser) in the
 * setup code of tests that meet the following three conditions:
 *  - Uses the Jasmine ajax mock;
 *  - Invokes syncLD;
 *  - Tries to do something with the request data at the mock server.
 */
export const JSONLDParser = {
    test(xhr: any) {
        return xhr.contentType() === 'application/ld+json';
    },
    parse(params) {
        return JSON.parse(params);
    },
};

/**
 * A trick to get access to the current spec/suite.
 */
const introspector = {
    spec: false,
    names: [],
    path() {
        return this.names.join(' > ');
    },
    suiteStarted(info) {
        this.names.push(info.description);
        this.trigger('start:suite');
    },
    specStarted(info) {
        this.spec = true;
        this.names.push(info.description);
        this.trigger('start:spec');
    },
    specDone() {
        this.trigger('end:spec');
        this.spec = false;
        this.names.pop();
    },
    suiteDone() {
        this.trigger('end:suite');
        this.names.pop();
    },
};

extend(introspector, Events);
jasmine.getEnv().addReporter(introspector);

/**
 * Call this inside a suite or spec to automatically disable it if
 * `condition` is not met and show the reason in the console.
 * Assign the return value to a local override of the `it` variable
 * if you are applying this to a suite.
 */
export function onlyIf(condition, message) {
    function report() {
        const path = introspector.path();
        console.debug(`${path}:\n disabled in this environment:\n  ${message}`);
    }
    if (!condition) {
        let registered = false;
        if (introspector.spec) {
            report();
            pending(message);
        }
        return (description, f?, t?) => it(description, function() {
            if (!registered) {
                registered = true;
                (introspector as unknown as Events).once('end:suite', report);
            }
            pending(message);
        });
    }
    return it;
}
