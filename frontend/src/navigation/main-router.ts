import { extend } from 'lodash';

import Router from '../core/router';

export default class MainRouter extends Router {}

extend(MainRouter.prototype, {
    routes: {
        '(arrive)': 'arrive',
        'leave': 'leave',
        'explore': 'explore',
        'upload': 'upload',
        'register': 'register',
        'confirm-registration/:key': 'confirm-registration',
    },
});