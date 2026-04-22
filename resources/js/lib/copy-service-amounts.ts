import { formatMxn } from '@/lib/format-mxn';

/**
 * Copia el monto total (MXN) con aclaración de que incluye envío — útil para WhatsApp / cliente.
 */
export async function copyServiceAmountsToClipboard(total: number): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(`${formatMxn(total)} ya con envío`);
        return true;
    } catch {
        return false;
    }
}
