import { type LucideIcon, Clock, LayoutGrid, User } from 'lucide-react';

export type DriverNavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

export const driverNavItems: DriverNavItem[] = [
    { title: 'Inicio', href: '/dashboard', icon: LayoutGrid },
    { title: 'Historial', href: '/history', icon: Clock },
    { title: 'Perfil', href: '/settings/profile', icon: User },
];
