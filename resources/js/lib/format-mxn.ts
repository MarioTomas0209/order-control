/**
 * Montos para la UI y copiado: $1,500.00 · $499.00
 * (miles con coma, decimales con punto, prefijo $)
 */
export function formatMxn(amount: number): string {
    return (
        '$' +
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    );
}
