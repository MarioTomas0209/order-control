import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Perfil',
        url: '/settings/profile',
        icon: null,
    },
    {
        title: 'Contraseña',
        url: '/settings/password',
        icon: null,
    },
    {
        title: 'Apariencia',
        url: '/settings/appearance',
        icon: null,
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();

    return (
        <div className="w-full py-2 lg:py-4">
            <Heading title="Ajustes" description="Perfil, seguridad y apariencia de tu cuenta" />

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-10">
                <aside className="w-full shrink-0 lg:w-52">
                    <nav
                        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
                        aria-label="Secciones de ajustes"
                    >
                        {sidebarNavItems.map((item) => {
                            const isActive = url === item.url;

                            return (
                                <Button
                                    key={item.url}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'shrink-0 justify-center lg:w-full lg:justify-start',
                                        isActive && 'bg-muted font-medium',
                                    )}
                                >
                                    <Link href={item.url} prefetch>
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="lg:hidden" />

                <div className="min-w-0 flex-1 lg:max-w-2xl">
                    <section className="max-w-xl space-y-10">{children}</section>
                </div>
            </div>
        </div>
    );
}
