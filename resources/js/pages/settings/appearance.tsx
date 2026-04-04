import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import DriverAppLayout from '@/layouts/driver-app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ajustes',
        href: '/settings/profile',
    },
    {
        title: 'Apariencia',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apariencia" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Configuración de apariencia" description="Actualiza la configuración de apariencia de tu cuenta" />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </DriverAppLayout>
    );
}
