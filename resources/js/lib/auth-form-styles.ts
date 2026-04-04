import { cn } from '@/lib/utils';

/** Estilos compartidos entre login y registro (Control de Repartos). */
export const authFieldClass = cn(
    'h-12 rounded-xl border-0 bg-gray-100 text-gray-900 shadow-none placeholder:text-gray-400',
    'focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-muted dark:text-foreground dark:placeholder:text-muted-foreground',
);

export const authLabelClass =
    'text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-muted-foreground';
