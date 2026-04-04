import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { formatMxn } from '@/lib/format-mxn';
import {
    cleanOrderLinesForSubmit,
    emptyOrderLine,
    orderLinesAffectOrderCost,
    parseAmountInput,
    sumOrderLineAmounts,
    type OrderLineFormRow,
} from '@/lib/order-lines-form';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo } from 'react';

const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'card', label: 'Tarjeta' },
] as const;

type OrderLineFromServer = { label: string; amount: string };

type ServiceEditProps = {
    service: {
        id: number;
        order_cost: string;
        delivery_cost: string;
        payment_type: (typeof PAYMENT_OPTIONS)[number]['value'];
        notes: string;
        order_lines: OrderLineFromServer[];
    };
};

function serverLinesToForm(rows: OrderLineFromServer[]): OrderLineFormRow[] {
    return rows.map((r) => ({ label: r.label, amount: r.amount }));
}

export default function ServicesEdit({ service }: ServiceEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Editar servicio', href: `/services/${service.id}/edit` },
    ];

    const form = useForm({
        order_cost: service.order_cost,
        delivery_cost: service.delivery_cost,
        payment_type: service.payment_type,
        notes: service.notes,
        order_lines: serverLinesToForm(service.order_lines),
    });

    const linesDriveOrder = orderLinesAffectOrderCost(form.data.order_lines);

    const totalPreview = useMemo(() => {
        const order = linesDriveOrder ? sumOrderLineAmounts(form.data.order_lines) : parseAmountInput(String(form.data.order_cost));
        const delivery = parseAmountInput(String(form.data.delivery_cost));
        return Math.round((order + delivery) * 100) / 100;
    }, [form.data.order_cost, form.data.delivery_cost, form.data.order_lines, linesDriveOrder]);

    useEffect(() => {
        if (!linesDriveOrder) {
            return;
        }
        const fixed = sumOrderLineAmounts(form.data.order_lines).toFixed(2);
        if (form.data.order_cost !== fixed) {
            form.setData('order_cost', fixed);
        }
    }, [form.data.order_lines, linesDriveOrder]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const cleaned = cleanOrderLinesForSubmit(form.data.order_lines);
        form.transform(() => ({
            order_cost: cleaned.length > 0 ? cleaned.reduce((s, r) => s + r.amount, 0) : parseAmountInput(String(form.data.order_cost)),
            delivery_cost: parseAmountInput(String(form.data.delivery_cost)),
            payment_type: form.data.payment_type,
            notes: form.data.notes,
            order_lines: cleaned.length > 0 ? cleaned : [],
        }));
        form.patch(route('services.update', service.id), { preserveScroll: true });
    };

    const formattedTotal = formatMxn(totalPreview);

    const addLine = () => {
        form.setData('order_lines', [...form.data.order_lines, emptyOrderLine()]);
    };

    const removeLine = (index: number) => {
        form.setData(
            'order_lines',
            form.data.order_lines.filter((_, i) => i !== index),
        );
    };

    const updateLine = (index: number, patch: Partial<OrderLineFormRow>) => {
        const next = form.data.order_lines.map((row, i) => (i === index ? { ...row, ...patch } : row));
        form.setData('order_lines', next);
    };

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Editar servicio" />

            <div className="flex flex-col gap-4">
                <Link
                    href={route('dashboard')}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="size-4" />
                    Volver al inicio
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Editar servicio</h1>
                </div>

                <Card className="border-0 shadow-md">
                    <CardContent className="p-5">
                        <form onSubmit={submit} className="flex flex-col gap-5">
                            <div className="grid gap-3">
                                <div className="flex flex-wrap items-end justify-between gap-2">
                                    <div>
                                        <span className="text-sm font-medium leading-none">Lista del pedido (opcional)</span>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1 rounded-lg" onClick={addLine}>
                                        <Plus className="size-3.5" />
                                        Agregar producto
                                    </Button>
                                </div>

                                {form.data.order_lines.length > 0 ? (
                                    <ul className="flex flex-col gap-2">
                                        {form.data.order_lines.map((row, index) => (
                                            <li key={index} className="flex flex-wrap items-end gap-2">
                                                <div className="grid min-w-0 flex-1 gap-1.5">
                                                    <Label className="sr-only" htmlFor={`edit-line-label-${index}`}>
                                                        Producto
                                                    </Label>
                                                    <Input
                                                        id={`edit-line-label-${index}`}
                                                        placeholder="Ej. Tortillas"
                                                        value={row.label}
                                                        onChange={(e) => updateLine(index, { label: e.target.value })}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div className="grid w-[7.5rem] shrink-0 gap-1.5">
                                                    <Label className="sr-only" htmlFor={`edit-line-amount-${index}`}>
                                                        Monto
                                                    </Label>
                                                    <Input
                                                        id={`edit-line-amount-${index}`}
                                                        type="number"
                                                        inputMode="decimal"
                                                        min={0}
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={row.amount}
                                                        onChange={(e) => updateLine(index, { amount: e.target.value })}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive size-9 shrink-0 rounded-lg"
                                                    onClick={() => removeLine(index)}
                                                    aria-label="Quitar línea"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-xs hidden">Sin lista: usa solo el campo &quot;Costo pedido&quot; abajo.</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="order_cost">Costo pedido</Label>
                                <Input
                                    id="order_cost"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.data.order_cost}
                                    onChange={(e) => form.setData('order_cost', e.target.value)}
                                    required
                                    readOnly={linesDriveOrder}
                                    autoComplete="off"
                                    className={cn(linesDriveOrder && 'bg-muted/60')}
                                />
                                {linesDriveOrder ? (
                                    <p className="text-muted-foreground text-xs">Calculado desde la lista. Quita las líneas para editar el total a mano.</p>
                                ) : null}
                                <InputError message={form.errors.order_cost} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="delivery_cost">Costo envío</Label>
                                <Input
                                    id="delivery_cost"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.data.delivery_cost}
                                    onChange={(e) => form.setData('delivery_cost', e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                                <InputError message={form.errors.delivery_cost} />
                            </div>

                            <div
                                className={cn(
                                    'rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm',
                                )}
                                aria-live="polite"
                            >
                                <span className="text-muted-foreground">Total (pedido + envío): </span>
                                <span className="font-semibold tabular-nums">{formattedTotal}</span>
                            </div>

                            <div className="grid gap-2">
                                <span className="text-sm font-medium leading-none">Tipo de pago</span>
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    {PAYMENT_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
                                                form.data.payment_type === opt.value
                                                    ? 'border-primary bg-primary/10 text-foreground'
                                                    : 'border-muted bg-background hover:bg-muted/40',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_type"
                                                value={opt.value}
                                                checked={form.data.payment_type === opt.value}
                                                onChange={() => form.setData('payment_type', opt.value)}
                                                className="sr-only"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={form.errors.payment_type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notas (opcional)</Label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    placeholder="Instrucciones, referencia, etc."
                                    className={cn(
                                        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[88px] w-full rounded-md border px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                                    )}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                />
                                <InputError message={form.errors.notes} />
                            </div>

                            <Button type="submit" className="h-12 rounded-xl text-base shadow-md" size="lg" disabled={form.processing} variant="blue">
                                Guardar cambios
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DriverAppLayout>
    );
}
