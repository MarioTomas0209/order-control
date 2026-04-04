import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.url === page.url}>
                            <Link
                                href={item.url}
                                prefetch
                                className="relative"
                                title={item.notificationDot ? 'Hay jornadas pendientes de reporte o conciliación con la base' : undefined}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                {item.notificationDot ? (
                                    <span
                                        className="bg-destructive absolute end-1 top-1.5 size-2 rounded-full ring-2 ring-sidebar"
                                        aria-hidden
                                    />
                                ) : null}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
