/** Copia texto plano al portapapeles (p. ej. mensajes para la base / WhatsApp). */
export async function copyPlainText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
