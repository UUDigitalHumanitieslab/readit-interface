import '@dhl-uu/jquery-promise';

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
