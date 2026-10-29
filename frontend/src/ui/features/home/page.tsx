import { useTranslation } from 'react-i18next';
import { commonNamespace } from '@/infra/i18n/namespaces';

export default function HomePage() {
    const { t } = useTranslation(commonNamespace);

    return (
        <main className="p-8">
            <h1 className="text-2xl font-semibold">{t('home.title')}</h1>
            <p className="mt-2 text-neutral-600">{t('home.description')}</p>
        </main>
    );
}
