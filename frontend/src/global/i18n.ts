import { constant } from 'lodash';
import * as i18next from 'i18next';
import * as languageDetector from 'i18next-browser-languagedetector';

import * as english from '../i18n/en/translation.json';
import * as french from '../i18n/fr/translation.json';
import channel from '../i18n/radio';

const i18nPromise = new Promise(function(resolve, reject) {
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
            reject(error);
        } else {
            resolve(i18next);
        }
    });
});

channel.reply('i18next', constant(i18nPromise));

export { i18nPromise, i18next };
