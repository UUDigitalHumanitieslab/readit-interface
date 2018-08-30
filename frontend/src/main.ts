import * as bb from 'backbone';
import * as $ from 'jquery';

import domReady from './global/dom-ready';
import { i18nPromise } from './global/i18n';
import './global/promise-shim';
import './aspects/example';

$.when(domReady, i18nPromise).done(function() {
    bb.history.start();
});
