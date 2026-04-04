import { formatMxn } from '@/lib/format-mxn';

export type OrderLineClipboard = { label: string; amount: number };

/**
 * WhatsApp suele colapsar saltos de línea simples al pegar; conviene:
 * - párrafos separados con línea en blanco (\n\n o \r\n\r\n)
 * - viñetas sin espacios al inicio de línea
 * - CRLF mejora el pegado en algunos móviles / Windows
 */
const EOL = '\r\n';
const BLANK = `${EOL}${EOL}`;

/** Texto listo para pegar en WhatsApp (montos en formato de la app). */
export function buildServiceAmountsClipboardText(
    order: number,
    delivery: number,
    total: number,
    orderLines?: OrderLineClipboard[] | null,
): string {
    const blocks: string[] = [];

    if (orderLines && orderLines.length > 0) {
        const items = orderLines.map((row) => `• ${row.label}: ${formatMxn(row.amount)}`).join(EOL);
        blocks.push(`Pedido: ${formatMxn(order)}${BLANK}${items}`);
    } else {
        blocks.push(`Pedido: ${formatMxn(order)}`);
    }

    blocks.push(`Envío: ${formatMxn(delivery)}`);
    blocks.push(`Total: ${formatMxn(total)}`);

    return blocks.join(BLANK);
}

export async function copyServiceAmountsToClipboard(
    order: number,
    delivery: number,
    total: number,
    orderLines?: OrderLineClipboard[] | null,
): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(buildServiceAmountsClipboardText(order, delivery, total, orderLines));
        return true;
    } catch {
        return false;
    }
}
