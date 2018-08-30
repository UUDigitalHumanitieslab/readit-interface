import * as $ from 'jquery';
import * as _ from 'lodash';
import * as i18next from 'i18next/dist/umd/i18next';
import * as languageDetector from 'i18next-browser-languagedetector';
import Handlebars from 'handlebars/dist/handlebars.runtime';

import * as french from '../i18n/fr.json'

const deferred = $.Deferred();
const i18nPromise = deferred.promise();

i18next.use(
    languageDetector
).init({
    resources: {
        fr: {
            translation: french,
        },
    },
}, function(error, t) {
    if (error) {
        deferred.reject(error);
    } else {
        deferred.resolve(i18next);
    }
});

/**
 * Handlebars helper allowing you to do {{i18n 'key'}} in templates.
 *
 * The key and the current context of the template are passed to i18next.t,
 * so that template context properties are available for interpolation.
 * Passing options to i18next.t is also supported.
 * {{i18n 'key' option=value}}
 *
 * The helper can also be used as a block. The block contents will then be
 * used as default value.
 * {{#i18n 'key'}}Default fallback with {{variables}}{{/i18n}}.
 *
 * i18next escapes the interpolation values by default. The resulting
 * string, however, is not escaped again by Handlebars. Translation segments
 * must be safe!
 */
Handlebars.registerHelper('i18n', function(key: string, environment) {
    let options = _.defaults({}, environment.hash);
    options.replace = _.defaults(options.replace, options, this);
    if (environment.fn) options.defaultValue = environment.fn(this);
    return new Handlebars.SafeString(i18next.t(key, options));
});

export { i18nPromise, i18next };
