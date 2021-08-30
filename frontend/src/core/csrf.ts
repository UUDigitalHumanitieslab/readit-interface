import { extend, identity as id, overArgs } from 'lodash';
import { sync } from 'backbone';
import * as Cookies from 'js-cookie';

const nonRelative = /^(https?:)?\/\//;
const sameOrigin = RegExp(window.location.host);

/**
 * Insert the CSRF token header into $.ajax-compatible request options.
 * Returns the object unchanged if the request is nonmodifying or
 * to another host.
 */
export function addCSRFToken(ajaxOptions) {
    const url = ajaxOptions.url, method = ajaxOptions.method;
    if (method === 'GET' || method === 'HEAD') return ajaxOptions;
    if (url && nonRelative.test(url) && !sameOrigin.test(url)) {
        return ajaxOptions;
    }
    const headers = ajaxOptions.headers || {};
    ajaxOptions.headers = extend(headers, {
        'X-CSRFToken': Cookies.get('csrftoken'),
    });
    return ajaxOptions;
}

/**
 * A modified Backbone.sync which calls addCSRFToken automatically.
 */
export const syncWithCSRF = overArgs(sync, [id, id, addCSRFToken]);
