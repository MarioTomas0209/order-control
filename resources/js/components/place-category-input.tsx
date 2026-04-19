import { Input } from '@/components/ui/input';
import { apiJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useEffect, useId, useRef, useState } from 'react';

export type PlaceCategoryInputProps = {
    id: string;
    value: string;
    onChange: (category: string) => void;
    disabled?: boolean;
    /** Coincidir con la validación del backend (p. ej. 120). */
    maxLength?: number;
    placeholder?: string;
    invalid?: boolean;
    required?: boolean;
};

type CategoriesResponse = { data: string[] };

function categoriesUrl(query: string): string {
    const base = route('api.places.categories');
    const trimmed = query.trim();

    return trimmed === '' ? base : `${base}?${new URLSearchParams({ q: trimmed })}`;
}

export function PlaceCategoryInput({
    id,
    value,
    onChange,
    disabled,
    maxLength = 120,
    placeholder,
    invalid,
    required,
}: PlaceCategoryInputProps) {
    const listboxId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void (async () => {
                setLoading(true);
                try {
                    const res = await apiJson<CategoriesResponse>(categoriesUrl(value), { signal: controller.signal });
                    if (!controller.signal.aborted) {
                        setSuggestions(res.data);
                    }
                } catch {
                    if (!controller.signal.aborted) {
                        setSuggestions([]);
                    }
                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false);
                    }
                }
            })();
        }, 280);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [value]);

    useEffect(() => {
        function onDocMouseDown(event: MouseEvent): void {
            const node = containerRef.current;
            if (node && event.target instanceof Node && !node.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onDocMouseDown);

        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, []);

    const showList = open && (loading || suggestions.length > 0 || (!loading && value.trim() !== ''));

    return (
        <div ref={containerRef} className="relative">
            <Input
                id={id}
                role="combobox"
                aria-expanded={showList}
                aria-controls={listboxId}
                aria-autocomplete="list"
                autoComplete="off"
                value={value}
                disabled={disabled}
                maxLength={maxLength}
                placeholder={placeholder}
                required={required}
                aria-invalid={invalid}
                className={cn(invalid && 'border-destructive')}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
            />
            {showList ? (
                <ul
                    id={listboxId}
                    role="listbox"
                    className={cn(
                        'bg-popover text-popover-foreground absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border p-1 shadow-md',
                    )}
                >
                    {loading && suggestions.length === 0 ? (
                        <li className="text-muted-foreground px-2 py-1.5 text-sm">Cargando…</li>
                    ) : null}
                    {!loading && suggestions.length === 0 && value.trim() !== '' ? (
                        <li className="text-muted-foreground px-2 py-1.5 text-sm">Sin coincidencias; puedes usar una categoría nueva.</li>
                    ) : null}
                    {suggestions.map((item) => (
                        <li
                            key={item}
                            role="option"
                            className="hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm px-2 py-1.5 text-sm"
                            onMouseDown={(event) => {
                                event.preventDefault();
                                onChange(item);
                                setOpen(false);
                            }}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            ) : null}
            <p className="text-muted-foreground mt-1 text-xs">
                Sugerencias según categorías ya usadas en locales aprobados (coinciden sin importar mayúsculas).
            </p>
        </div>
    );
}
