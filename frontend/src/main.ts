import { history } from 'backbone';
import { when, ready } from 'jquery';
import '@dhl-uu/jquery-promise';

import { baseUrl } from 'config.json';
import { i18nPromise } from './global/i18n';
import './global/internalLinks';
import './global/hbsHelpers';
import user from './global/user';
import { prefetch } from './global/ld-store';
import './global/item-cache';
import './aspects/readit';
import './aspects/authentication';
import { initScrollEasing } from './utilities/scrolling-utilities';

when(ready, i18nPromise).done(function () {
    initScrollEasing();
    user.fetch();
    let success = history.start({
        root: baseUrl,
        pushState: true,
    });

    prefetch();
});
