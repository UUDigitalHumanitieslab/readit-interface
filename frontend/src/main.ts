import * as bb from 'backbone';
import * as $ from 'jquery';

import { i18nPromise } from './global/i18n';
import './global/promise-shim';
import './aspects/example';

$.when($.ready, i18nPromise).done(function() {
    bb.history.start();
});
