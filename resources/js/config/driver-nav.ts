import { type LucideIcon, Clock, LayoutGrid } from 'lucide-react';

export type DriverNavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

/**
 * Barra inferior en móvil: solo las vistas más frecuentes.
 * Perfil, usuarios (admin) y demás enlaces van en el menú del header (avatar).
 */
export const driverNavItems: DriverNavItem[] = [
    { title: 'Inicio', href: '/dashboard', icon: LayoutGrid },
    { title: 'Historial', href: '/history', icon: Clock },
];
