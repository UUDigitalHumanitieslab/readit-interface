import '@dhl-uu/jquery-promise';

import { extend } from 'lodash';
import { Events } from 'backbone';

import './global/hbsHelpers';
import { i18nPromise } from './global/i18n';

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
