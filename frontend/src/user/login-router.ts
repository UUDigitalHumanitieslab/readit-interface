import { extend } from 'lodash';

import Router from '../core/router';

export default class LoginRouter extends Router {}

extend(LoginRouter.prototype, {
    routes: {
        'login': 'login',
    },
});
