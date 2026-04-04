export type OrderLineFormRow = { label: string; amount: string };

export function parseAmountInput(value: string): number {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

export function emptyOrderLine(): OrderLineFormRow {
    return { label: '', amount: '' };
}

export function cleanOrderLinesForSubmit(rows: OrderLineFormRow[]): { label: string; amount: number }[] {
    return rows
        .filter((r) => r.label.trim() !== '' && String(r.amount).trim() !== '')
        .map((r) => ({
            label: r.label.trim(),
            amount: Math.round(parseAmountInput(r.amount) * 100) / 100,
        }));
}

export function orderLinesAffectOrderCost(rows: OrderLineFormRow[]): boolean {
    return rows.some((r) => r.label.trim() !== '' && String(r.amount).trim() !== '');
}

export function sumOrderLineAmounts(rows: OrderLineFormRow[]): number {
    return Math.round(rows.reduce((s, r) => s + parseAmountInput(r.amount), 0) * 100) / 100;
}
