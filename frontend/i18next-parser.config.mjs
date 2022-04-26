import HbsI18nLexer from 'handlebars-i18next-parser';

const sourceDir = 'src';
const i18nDir = `${sourceDir}/i18n`;

export default {
    input: [`${sourceDir}/**/*.{t,hb}s`, `!${sourceDir}/**/*-te{mplate,st}.ts`],
    output: `${i18nDir}/$LOCALE/$NAMESPACE.json`,
    locales: ['en', 'fr'],
    resetDefaultValueLocale: 'en',
    indentation: 4,
    lexers: {
        hbs: [HbsI18nLexer],
    },
};
