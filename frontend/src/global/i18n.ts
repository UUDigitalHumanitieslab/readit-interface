import { Deferred } from 'jquery';
import * as i18next from 'i18next';
import * as languageDetector from 'i18next-browser-languagedetector';

import * as english from '../i18n/en/translation.json';
import * as french from '../i18n/fr/translation.json';

const deferred = Deferred();
const i18nPromise = deferred.promise();

i18next.use(
    languageDetector
).init({
    fallbackLng: ['en', 'dev'],
    resources: {
        en: {
            translation: english,
        },
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
