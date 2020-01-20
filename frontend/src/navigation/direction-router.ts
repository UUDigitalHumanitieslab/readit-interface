import { extend } from 'lodash';

import Router from '../core/router';

export default class DirectionRouter extends Router {}

extend(DirectionRouter.prototype, {
    routes: {
        '(arrive)': 'arrive',
        'leave': 'leave',
        'explore': 'explore',
        'upload': 'upload',
        'register': 'register',
    },
});
