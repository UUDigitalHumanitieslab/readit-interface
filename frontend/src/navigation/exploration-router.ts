import { extend } from 'lodash';

import Router from '../core/router';

export default class ExplorationRouter extends Router {}

extend(ExplorationRouter.prototype, {
    routes: {
        'explore/source/:serial':             'source',
        'explore/source/:serial/annotations': 'source:annotated',
        'explore/item/:serial':               'item',
        'explore/item/:serial/edit':          'item:edit',
        'explore/item/:serial/related':       'item:related',
        'explore/item/:serial/related/edit':  'item:related:edit',
        'explore/item/:serial/external':      'item:external',
        'explore/item/:serial/external/edit': 'item:external:edit',
        'explore/item/:serial/annotations':   'item:annotations',
    },
});
