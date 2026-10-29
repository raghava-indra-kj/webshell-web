import 'i18next';
import type common from '../../public/locales/en/common.json';
import { commonNamespace } from '../infra/i18n/namespaces';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof commonNamespace;
        enableSelector: false;
    }

    interface ResourceNamespaceMap {
        [commonNamespace]: typeof common;
    }
}
