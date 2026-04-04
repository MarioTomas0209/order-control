import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { DriverBottomNav } from '@/components/driver-bottom-nav';
import { DriverMobileHeader } from '@/components/driver-mobile-header';
import { useMinWidth } from '@/hooks/use-min-width';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

interface DriverAppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function DriverAppLayout({ children, breadcrumbs = [] }: DriverAppLayoutProps) {
    const isDesktop = useMinWidth(1024);

    return (
        <AppShell variant="sidebar">
            {isDesktop ? <AppSidebar /> : null}
            <AppContent
                variant="sidebar"
                className={cn('flex min-h-svh min-w-0 flex-col overflow-x-hidden', !isDesktop && 'bg-muted/40')}
            >
                {isDesktop ? <AppSidebarHeader breadcrumbs={breadcrumbs} /> : <DriverMobileHeader />}
                <div
                    className={cn(
                        'mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col gap-4 overflow-x-hidden px-4 pb-6 pt-4 lg:max-w-none lg:px-6',
                        !isDesktop && 'pb-28',
                    )}
                >
                    {children}
                </div>
                {!isDesktop ? <DriverBottomNav /> : null}
            </AppContent>
        </AppShell>
    );
}
