import { extend } from 'lodash';

import { authRoot } from 'config.json';
import Model from '../core/model';

export interface UserCredentials {
    username: string;
    password: string;
}

export default class User extends Model {
    login(credentials: UserCredentials): JQuery.jqXHR {
        return this.save(null, {
            url: this.loginUrl,
            method: 'POST',
            attrs: credentials,
            success: () => this.trigger('login:success', this).fetch(),
            error: () => this.trigger('login:error', this),
        });
    }

    logout(): JQuery.jqXHR {
        return this.save(null, {
            url: this.logoutUrl,
            method: 'POST',
            success: () => this.clear().trigger('logout:success', this),
            error: () => this.trigger('logout:error', this),
        });
    }

    parse(response, options) {
        if (response.key || response.detail) {
            // This is a login with an authentication token OR a
            // logout with a detail message. We don't use either, so
            // remove it in order to prevent a superfluous change
            // event.
            return {};
        }
        return response;
    }
}

extend(User.prototype, {
    idAttribute: 'pk',
    url: authRoot + 'user/',
    loginUrl: authRoot + 'login/',
    logoutUrl: authRoot + 'logout/',
});
