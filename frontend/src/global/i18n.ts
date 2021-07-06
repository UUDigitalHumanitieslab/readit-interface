import { Deferred } from 'jquery';
import * as i18next from 'i18next';
import * as languageDetector from 'i18next-browser-languagedetector';
import Handlebars from 'handlebars/dist/handlebars.runtime';
import registerI18nHelper from 'handlebars-i18next';

import * as french from '../i18n/fr.json';

const deferred = Deferred();
const i18nPromise = deferred.promise();

i18next.use(
    languageDetector
).init({
    fallbackLng: ['en', 'dev'],
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

export { i18nPromise, i18next };
