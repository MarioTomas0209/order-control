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
    csrf_token: string;
    auth: Auth;
    pendingBaseReportCount: number;
    /** Solo admin: sugerencias de locales sin leer (notificaciones en BD). */
    pendingPlaceSuggestionNotificationsCount: number;
    /** Solo repartidor: avisos de sugerencias de locales rechazadas (sin leer). */
    unreadPlaceRejectedNotificationsCount: number;
    flash?: {
        success?: string | null;
    };
    [key: string]: unknown;
}

/** Local (API + pantalla Locales). */
export type PlaceDto = {
    id: number;
    name: string;
    category: string;
    phone: string | null;
    whatsapp: string | null;
    address: string;
    google_maps_link: string;
    latitude: number | null;
    longitude: number | null;
    photo_url: string | null;
    notes: string | null;
    status: string;
    status_label: string;
    created_by?: number;
    creator_name?: string;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
};

export type PaginatedPlacesResponse = {
    data: PlaceDto[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        last_page: number;
        path: string;
        per_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
};

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
