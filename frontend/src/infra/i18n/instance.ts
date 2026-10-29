import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { i18nConfig } from './config';

/** Initializes i18next and connects translation loading to React. */
export async function initializeI18n(): Promise<void> {
    i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next);

    i18n.on('languageChanged', (language) => {
        document.documentElement.lang = language;
        document.documentElement.dir = i18n.dir(language);
    });

    await i18n.init(i18nConfig);
}

export { i18n };
