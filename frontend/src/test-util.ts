import '@dhl-uu/jquery-promise';

import { extend } from 'lodash';
import { Events } from 'backbone';

import Store from './jsonld/store';
import './global/hbsHelpers';
import { i18nPromise } from './global/i18n';

/**
 * Wrap the following functions in beforeEach() and afterEach(),
 * respectively, to use a store in all tests of a suite.
 */
export function startStore() {
    this._globalGraph = new Store();
}
export function endStore() {
    this._globalGraph.off().stopListening().stopReplying().reset();
    delete this._globalGraph;
}

/**
 * Wrap this in a beforeAll() to enable i18n in all tests of a suite.
 */
export function enableI18n() {
    return i18nPromise;
}

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
