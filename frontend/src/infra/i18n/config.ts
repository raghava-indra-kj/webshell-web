import type { InitOptions } from 'i18next';
import { commonNamespace } from './namespaces';

/** Defines the default internationalization configuration. */
export const i18nConfig: InitOptions = {
    fallbackLng: 'en',
    supportedLngs: ['en'],
    load: 'languageOnly',
    ns: [commonNamespace],
    defaultNS: commonNamespace,
    backend: { loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json` },
    detection: { order: ['navigator'], caches: [] },
    interpolation: { escapeValue: false },
};
