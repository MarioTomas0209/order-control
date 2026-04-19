import { driverNavItems } from '@/config/driver-nav';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function DriverBottomNav() {
    const page = usePage<SharedData>();
    const { url, props } = page;
    const pendingBaseReportCount = props.pendingBaseReportCount ?? 0;
    const pendingPlaceSuggestionNotificationsCount = props.pendingPlaceSuggestionNotificationsCount ?? 0;
    const unreadPlaceRejectedNotificationsCount = props.unreadPlaceRejectedNotificationsCount ?? 0;
    const isAdmin = props.auth?.user?.role === 'admin';
    const placesNotificationDot =
        (isAdmin && pendingPlaceSuggestionNotificationsCount > 0) ||
        (!isAdmin && unreadPlaceRejectedNotificationsCount > 0);

    return (
        <nav
            className="bg-background/95 supports-[backdrop-filter]:bg-background/90 fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
            aria-label="Navegación principal"
        >
            <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1">
                {driverNavItems.map((item) => {
                    const isActive = item.href === '/dashboard' ? url === '/dashboard' : url.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            title={
                                item.href === '/history' && pendingBaseReportCount > 0
                                    ? 'Hay jornadas pendientes de reporte o conciliación con la base'
                                    : item.href === '/places' && isAdmin && pendingPlaceSuggestionNotificationsCount > 0
                                      ? 'Hay sugerencias de locales pendientes de revisar'
                                      : item.href === '/places' && !isAdmin && unreadPlaceRejectedNotificationsCount > 0
                                        ? 'Hay avisos sobre sugerencias de locales no aprobadas'
                                        : undefined
                            }
                            className={cn(
                                'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors sm:text-xs',
                                isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span className="relative inline-flex shrink-0">
                                <item.icon className={cn('size-5', isActive && 'text-primary')} strokeWidth={isActive ? 2.25 : 2} />
                                {item.href === '/history' && pendingBaseReportCount > 0 ? (
                                    <span
                                        className="bg-destructive absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-background"
                                        aria-hidden
                                    />
                                ) : null}
                                {item.href === '/places' && placesNotificationDot ? (
                                    <span
                                        className="bg-destructive absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-background"
                                        aria-hidden
                                    />
                                ) : null}
                            </span>
                            <span className="truncate">{item.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
