import { history } from 'backbone';
import { when, ready } from 'jquery';
import '@dhl-uu/jquery-promise';

import { baseUrl } from 'config.json';
import './global/source-ontology';
import './global/scroll-easings';
import { i18nPromise } from './global/i18n';
import './global/internalLinks';
import './global/hbsHelpers';
import './global/hbsPartials';
import user from './global/user';
import { prefetch } from './global/ld-store';
import './global/item-cache';
import './global/history-notfound-trigger';
import './aspects/navigation';
import './aspects/authentication';
import './aspects/registration';
import './aspects/exploration';

user.fetch();
when(ready, i18nPromise).done(function () {
    history.start({
        root: baseUrl,
        pushState: true,
    });
    prefetch();
});
