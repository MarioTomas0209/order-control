import type { OrderLineFormRow } from '@/lib/order-lines-form';

const STORAGE_KEY = 'app-order:service-create-draft-v1';

/** Tras guardar un servicio: la próxima vez que se abra crear servicio no se restaura borrador (ni aunque localStorage falle al limpiar). */
export const SERVICE_CREATE_SESSION_CLEAR_FLAG = 'app-order:clear-service-draft-next-create';
const DRAFT_VERSION = 1;
/** Una semana; compras largas sin perder el borrador al volver otro día. */
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type ServiceCreateDraftPayload = {
    order_cost: string;
    delivery_cost: string;
    payment_type: 'cash' | 'transfer' | 'card';
    notes: string;
    order_lines: OrderLineFormRow[];
};

type StoredDraft = {
    v: number;
    savedAt: number;
    payload: ServiceCreateDraftPayload;
};

export function isMeaningfulServiceCreateDraft(payload: ServiceCreateDraftPayload): boolean {
    if (payload.notes.trim() !== '') {
        return true;
    }
    if (payload.order_cost.trim() !== '') {
        return true;
    }
    if (payload.delivery_cost.trim() !== '') {
        return true;
    }
    return payload.order_lines.some((l) => l.label.trim() !== '' || String(l.amount).trim() !== '');
}

export function loadServiceCreateDraft(): ServiceCreateDraftPayload | null {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as StoredDraft;
        if (parsed.v !== DRAFT_VERSION || !parsed.payload) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed.payload;
    } catch {
        return null;
    }
}

export function saveServiceCreateDraft(payload: ServiceCreateDraftPayload): void {
    if (typeof window === 'undefined') {
        return;
    }
    if (!isMeaningfulServiceCreateDraft(payload)) {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
        return;
    }
    try {
        const stored: StoredDraft = {
            v: DRAFT_VERSION,
            savedAt: Date.now(),
            payload,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // quota / modo privado
    }
}

export function clearServiceCreateDraft(): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}
