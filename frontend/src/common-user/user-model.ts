import { extend } from 'lodash';
import { ModelSaveOptions } from 'backbone';

import { authRoot } from 'config.json';
import Model from '../core/model';

export interface UserCredentials {
    username: string;
    password: string;
}

export interface RegisterDetails {
    username: string;
    password1: string;
    password2: string;
    email: string;
}

export default class User extends Model {
    loginUrl: string;
    logoutUrl: string;
    registerUrl: string;
    confirmRegistrationUrl: string;
    permissions: string[];

    login(credentials: UserCredentials): JQuery.jqXHR {
        return this.save(null, {
            url: this.loginUrl,
            method: 'POST',
            attrs: credentials,
            success: (model, response, options) => {
                this.trigger('login:success', this).fetch();
            },
            error: () => this.trigger('login:error', this),
        } as ModelSaveOptions);
    }

    logout(): JQuery.jqXHR {
        return this.save(null, {
            url: this.logoutUrl,
            method: 'POST',
            success: () => this.clear().trigger('logout:success', this),
            error: () => this.trigger('logout:error', this),
        } as ModelSaveOptions);
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

    register(details: RegisterDetails): JQuery.jqXHR {
        return this.save(details, {
            url: this.registerUrl,
            method: 'POST',
            success: (model, response, options) => {
                this.trigger('registration:success', response.responseJSON);
            },
            error: (model, response, options) => {
                if (response.status == 400) {
                    this.trigger('registration:invalid', response.responseJSON);
                }
                else {
                    this.trigger('registration:error', response);
                }
            }
        } as ModelSaveOptions);
    }

    confirmRegistration(key: string): JQuery.jqXHR {
        return this.save({ "key": key }, {
            url: this.confirmRegistrationUrl,
            method: 'POST',
            success: (model, response, options) => {
                this.trigger('confirm-registration:success');
            },
            error: (model, response, options) => {
                if (response.status === 404) {
                    this.trigger('confirm-registration:notfound');
                }
                else {
                    this.trigger('confirm-registration:error', response);
                }
            }
        } as ModelSaveOptions);
    }

    hasPermission(permission): boolean {
        let permissions = this.get('permissions');
        if (!permissions) return false;
        return permissions.includes(permission);
    }
}

extend(User.prototype, {
    idAttribute: 'pk',
    url: authRoot + 'user/',
    loginUrl: authRoot + 'login/',
    logoutUrl: authRoot + 'logout/',
    registerUrl: authRoot + 'registration/',
    confirmRegistrationUrl: authRoot + 'registration/verify-email/',
});
