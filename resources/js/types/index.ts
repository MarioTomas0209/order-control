import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Punto de aviso (p. ej. reportes de la base pendientes) */
    notificationDot?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    pendingBaseReportCount: number;
    flash?: {
        success?: string | null;
    };
    [key: string]: unknown;
}

/** Fila de usuario en administración (listado / edición). */
export type ManagedUserRow = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    role_label: string;
    status: string;
    status_label: string;
};

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    phone?: string | null;
    role: 'admin' | 'driver';
    status?: 'active' | 'inactive';
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
