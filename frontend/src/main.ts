import * as bb from 'backbone';
import * as $ from 'jquery';
import '@dhl-uu/jquery-promise';

import * as config from 'config.json';
import { i18nPromise } from './global/i18n';
import './aspects/example';

$.when($.ready, i18nPromise).done(function() {
    let success = bb.history.start({
        root: config.baseUrl,
    });
});
