import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { copyPlainText } from '@/lib/copy-plain-text';
import { copyServiceAmountsToClipboard } from '@/lib/copy-service-amounts';
import { formatMxn } from '@/lib/format-mxn';
import {
    cleanOrderLinesForSubmit,
    emptyOrderLine,
    orderLinesAffectOrderCost,
    parseAmountInput,
    sumOrderLineAmounts,
    type OrderLineFormRow,
} from '@/lib/order-lines-form';
import {
    clearServiceCreateDraft,
    isMeaningfulServiceCreateDraft,
    loadServiceCreateDraft,
    saveServiceCreateDraft,
    SERVICE_CREATE_SESSION_CLEAR_FLAG,
    type ServiceCreateDraftPayload,
} from '@/lib/service-create-draft';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Copy, MessageCircle, Plus, Trash2, Wallet } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Nuevo servicio', href: '/services/create' },
];

const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'card', label: 'Tarjeta' },
] as const;
const CASH_SHORTCUTS = [50, 100, 200, 500, 1000] as const;

/** Mensajes que pide la base; solo referencia para copiar y pegar. */
const BASE_MESSAGES = {
    /** 1. Confirmación de lectura */
    read: 'En camino',
    /** 2. Seguimiento en local */
    waitingAtStore: 'En espera del pedido',
    /** 2. Seguimiento en ruta */
    headingToDelivery: 'En camino a la entrega',
    /** 3. Finalización */
    delivered: 'Entregado',
} as const;

const defaultForm = {
    order_cost: '',
    delivery_cost: '',
    payment_type: 'cash' as (typeof PAYMENT_OPTIONS)[number]['value'],
    notes: '',
    order_lines: [] as OrderLineFormRow[],
};

function normalizePaymentType(value: unknown): (typeof PAYMENT_OPTIONS)[number]['value'] {
    if (value === 'transfer' || value === 'card') {
        return value;
    }
    return 'cash';
}

type CopyFeedbackId = 'read' | 'wait' | 'route' | 'done';

export default function ServicesCreate() {
    const [amountsCopied, setAmountsCopied] = useState(false);
    const [recoveredBannerDismissed, setRecoveredBannerDismissed] = useState(false);
    const [baseStep1Done, setBaseStep1Done] = useState(false);
    const [baseStep2Done, setBaseStep2Done] = useState(false);
    const [baseStep3Done, setBaseStep3Done] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<CopyFeedbackId | null>(null);
    const [serviceTab, setServiceTab] = useState<'amounts' | 'base'>('amounts');
    const [customerPaidAmount, setCustomerPaidAmount] = useState('');

    const copyBaseLine = async (text: string, id: CopyFeedbackId) => {
        const ok = await copyPlainText(text);
        if (ok) {
            setCopyFeedback(id);
            window.setTimeout(() => setCopyFeedback(null), 2000);
        }
    };

    const draftSnapshot = useMemo(() => {
        if (typeof window === 'undefined') {
            return { draft: null as ServiceCreateDraftPayload | null, restored: false };
        }
        try {
            if (sessionStorage.getItem(SERVICE_CREATE_SESSION_CLEAR_FLAG) === '1') {
                return { draft: null, restored: false };
            }
        } catch {
            // modo privado / sessionStorage no disponible
        }
        const draft = loadServiceCreateDraft();
        const restored = draft !== null && isMeaningfulServiceCreateDraft(draft);
        return { draft, restored };
    }, []);

    const form = useForm({
        order_cost: draftSnapshot.draft?.order_cost ?? defaultForm.order_cost,
        delivery_cost: draftSnapshot.draft?.delivery_cost ?? defaultForm.delivery_cost,
        payment_type: normalizePaymentType(draftSnapshot.draft?.payment_type),
        notes: draftSnapshot.draft?.notes ?? defaultForm.notes,
        order_lines: draftSnapshot.draft?.order_lines ?? defaultForm.order_lines,
    });

    const formDataRef = useRef(form.data);
    formDataRef.current = form.data;

    /** Tras guardar el servicio con éxito: evita que el debounce o visibility vuelvan a escribir el borrador. */
    const skipDraftPersistenceRef = useRef(false);
    const draftDebounceTimerRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        try {
            if (sessionStorage.getItem(SERVICE_CREATE_SESSION_CLEAR_FLAG) === '1') {
                sessionStorage.removeItem(SERVICE_CREATE_SESSION_CLEAR_FLAG);
                clearServiceCreateDraft();
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (draftDebounceTimerRef.current !== null) {
            clearTimeout(draftDebounceTimerRef.current);
        }
        draftDebounceTimerRef.current = window.setTimeout(() => {
            draftDebounceTimerRef.current = null;
            if (skipDraftPersistenceRef.current) {
                return;
            }
            saveServiceCreateDraft(form.data as ServiceCreateDraftPayload);
        }, 450);
        return () => {
            if (draftDebounceTimerRef.current !== null) {
                clearTimeout(draftDebounceTimerRef.current);
                draftDebounceTimerRef.current = null;
            }
        };
    }, [form.data]);

    useEffect(() => {
        const flush = () => {
            if (document.visibilityState === 'hidden') {
                if (skipDraftPersistenceRef.current) {
                    return;
                }
                saveServiceCreateDraft(formDataRef.current as ServiceCreateDraftPayload);
            }
        };
        document.addEventListener('visibilitychange', flush);
        return () => document.removeEventListener('visibilitychange', flush);
    }, []);

    const discardDraft = () => {
        clearServiceCreateDraft();
        form.setData({
            order_cost: '',
            delivery_cost: '',
            payment_type: 'cash',
            notes: '',
            order_lines: [],
        });
        setRecoveredBannerDismissed(true);
    };

    const linesDriveOrder = orderLinesAffectOrderCost(form.data.order_lines);

    const orderNum = useMemo(() => {
        if (linesDriveOrder) {
            return sumOrderLineAmounts(form.data.order_lines);
        }
        return parseAmountInput(String(form.data.order_cost));
    }, [form.data.order_cost, form.data.order_lines, linesDriveOrder]);

    const deliveryNum = useMemo(() => parseAmountInput(String(form.data.delivery_cost)), [form.data.delivery_cost]);

    const totalPreview = useMemo(() => Math.round((orderNum + deliveryNum) * 100) / 100, [orderNum, deliveryNum]);
    const customerPaidNum = useMemo(() => parseAmountInput(customerPaidAmount), [customerPaidAmount]);
    const paymentDelta = useMemo(() => Math.round((customerPaidNum - totalPreview) * 100) / 100, [customerPaidNum, totalPreview]);

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
        form.post(route('services.store'), {
            preserveScroll: true,
            onSuccess: () => {
                skipDraftPersistenceRef.current = true;
                if (draftDebounceTimerRef.current !== null) {
                    clearTimeout(draftDebounceTimerRef.current);
                    draftDebounceTimerRef.current = null;
                }
                try {
                    sessionStorage.setItem(SERVICE_CREATE_SESSION_CLEAR_FLAG, '1');
                } catch {
                    // ignore
                }
                clearServiceCreateDraft();
            },
        });
    };

    const formattedTotal = formatMxn(totalPreview);

    const handleCopyAmounts = async () => {
        const ok = await copyServiceAmountsToClipboard(totalPreview);
        if (ok) {
            setAmountsCopied(true);
            window.setTimeout(() => setAmountsCopied(false), 2000);
        }
    };

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

    const submitActions = (
        <Button type="submit" className="h-12 rounded-xl text-base shadow-md" size="lg" disabled={form.processing} variant="blue">
            Guardar servicio
        </Button>
    );

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo servicio" />

            <div className="flex flex-col gap-4">
                <Link
                    href={route('dashboard')}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="size-4" />
                    Volver al inicio
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Registrar servicio</h1>
                    {draftSnapshot.restored && !recoveredBannerDismissed ? (
                        <div className="border-primary/25 bg-primary/5 mt-3 rounded-xl border px-3 py-2.5 text-sm leading-snug">
                            <p>Datos guardados temporalmente.</p>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground mt-2 text-xs font-medium underline underline-offset-2"
                                onClick={discardDraft}
                            >
                                Descartar borrador y empezar en blanco
                            </button>
                        </div>
                    ) : null}
                </div>

                <Card className="border-0 shadow-md">
                    <CardContent className="p-0">
                        <form onSubmit={submit} className="flex flex-col">
                            <Tabs value={serviceTab} onValueChange={(v) => setServiceTab(v as 'amounts' | 'base')} className="w-full">
                                <div className="border-border/60 bg-muted/20 px-4 pt-4 pb-3 sm:px-5">
                                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1">
                                        <TabsTrigger value="amounts" className="gap-2 py-2.5 text-xs sm:text-sm">
                                            <Wallet className="size-4 shrink-0" aria-hidden />
                                            Montos y cobro
                                        </TabsTrigger>
                                        <TabsTrigger value="base" className="gap-2 py-2.5 text-xs sm:text-sm">
                                            <MessageCircle className="size-4 shrink-0" aria-hidden />
                                            Seguimiento
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="amounts" className="mt-0 px-5 pt-2 pb-5 focus-visible:outline-none">
                                    <div className="flex flex-col gap-5">
                                        <div className="grid gap-3">
                                            <div className="flex flex-wrap items-end justify-between gap-2">
                                                <div>
                                                    <span className="text-sm leading-none font-medium">Lista del pedido (opcional)</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 shrink-0 gap-1 rounded-lg"
                                                    onClick={addLine}
                                                >
                                                    <Plus className="size-3.5" />
                                                    Agregar producto
                                                </Button>
                                            </div>

                                            {form.data.order_lines.length > 0 ? (
                                                <ul className="flex flex-col gap-2">
                                                    {form.data.order_lines.map((row, index) => (
                                                        <li key={index} className="flex flex-wrap items-end gap-2">
                                                            <div className="grid min-w-0 flex-1 gap-1.5">
                                                                <Label className="sr-only" htmlFor={`line-label-${index}`}>
                                                                    Producto
                                                                </Label>
                                                                <Input
                                                                    id={`line-label-${index}`}
                                                                    placeholder="Ej. Tortillas"
                                                                    value={row.label}
                                                                    onChange={(e) => updateLine(index, { label: e.target.value })}
                                                                    autoComplete="off"
                                                                />
                                                            </div>
                                                            <div className="grid w-[7.5rem] shrink-0 gap-1.5">
                                                                <Label className="sr-only" htmlFor={`line-amount-${index}`}>
                                                                    Monto
                                                                </Label>
                                                                <Input
                                                                    id={`line-amount-${index}`}
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
                                                <p className="text-muted-foreground hidden text-xs">
                                                    Sin lista: usa solo el campo &quot;Costo pedido&quot; abajo.
                                                </p>
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
                                                <p className="text-muted-foreground text-xs">
                                                    Calculado desde la lista. Quita las líneas o déjalas vacías para editar el total a mano.
                                                </p>
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
                                                'bg-muted/40 flex flex-col gap-3 rounded-xl border border-dashed px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
                                            )}
                                            aria-live="polite"
                                        >
                                            <div>
                                                <span className="text-muted-foreground">Total (pedido + envío): </span>
                                                <span className="font-semibold tabular-nums text-2xl text-primary">{formattedTotal}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-9 shrink-0 gap-1.5 rounded-lg"
                                                onClick={handleCopyAmounts}
                                            >
                                                <Copy className="size-3.5" />
                                                {amountsCopied ? 'Copiado' : 'Copiar total'}
                                            </Button>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="customer_paid_amount">Me paga con</Label>
                                            <Input
                                                id="customer_paid_amount"
                                                type="number"
                                                inputMode="decimal"
                                                min={0}
                                                step="0.01"
                                                placeholder="0.00"
                                                value={customerPaidAmount}
                                                onChange={(e) => setCustomerPaidAmount(e.target.value)}
                                                autoComplete="off"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {CASH_SHORTCUTS.map((amount) => (
                                                    <Button
                                                        key={amount}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-md px-3 text-xs"
                                                        onClick={() => setCustomerPaidAmount(String(amount))}
                                                    >
                                                        {formatMxn(amount)}
                                                    </Button>
                                                ))}
                                            </div>
                                            {customerPaidAmount.trim() !== '' ? (
                                                <p className="text-xs">
                                                    {paymentDelta > 0 ? (
                                                        <>
                                                            Cambio a devolver: <span className="font-semibold tabular-nums text-2xl text-red-500">{formatMxn(paymentDelta)}</span>
                                                        </>
                                                    ) : paymentDelta < 0 ? (
                                                        <>
                                                            Falta cobrar: <span className="font-semibold tabular-nums text-2xl text-red-500">{formatMxn(Math.abs(paymentDelta))}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Pago exacto: <span className="font-semibold tabular-nums text-2xl text-green-500">{formatMxn(0)}</span>
                                                        </>
                                                    )}
                                                </p>
                                            ) : (
                                                <p className="text-muted-foreground text-xs">Solo como ayuda visual. No se guarda en el servicio.</p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <span className="text-sm leading-none font-medium">Tipo de pago</span>
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
                                            <Label htmlFor="notes">Notas</Label>
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

                                        {submitActions}
                                    </div>
                                </TabsContent>

                                <TabsContent value="base" className="mt-0 px-5 pt-2 pb-5 focus-visible:outline-none">
                                    <div className="flex flex-col gap-4 rounded-xl border border-sky-200/80 bg-sky-50/80 p-4 dark:border-sky-500/25 dark:bg-sky-950/20">
                                        <ol className="flex flex-col gap-5">
                                            <li className="border-border/80 bg-background/80 dark:bg-background/40 flex flex-col gap-3 rounded-xl border p-4">
                                                <div className="flex flex-wrap items-baseline gap-2">
                                                    <span className="text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold">
                                                        1
                                                    </span>
                                                    <span className="font-medium">Confirmación de lectura</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <code className="bg-muted/80 text-foreground rounded-md px-2.5 py-1.5 text-sm font-medium">
                                                        {BASE_MESSAGES.read}
                                                    </code>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 gap-1.5"
                                                        onClick={() => copyBaseLine(BASE_MESSAGES.read, 'read')}
                                                    >
                                                        <Copy className="size-3.5" />
                                                        {copyFeedback === 'read' ? 'Copiado' : 'Copiar'}
                                                    </Button>
                                                </div>
                                                <label className="flex cursor-pointer items-start gap-3 pt-1">
                                                    <Checkbox
                                                        checked={baseStep1Done}
                                                        onCheckedChange={(c) => setBaseStep1Done(c === true)}
                                                        className="mt-0.5"
                                                        id="base-step-1"
                                                    />
                                                    <span className="text-sm leading-snug">Ya envié la confirmación de lectura a la base</span>
                                                </label>
                                            </li>

                                            <li className="border-border/80 bg-background/80 dark:bg-background/40 flex flex-col gap-3 rounded-xl border p-4">
                                                <div className="flex flex-wrap items-baseline gap-2">
                                                    <span className="text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold">
                                                        2
                                                    </span>
                                                    <span className="font-medium">Seguimiento</span>
                                                </div>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                                        <code className="bg-muted/80 max-w-full truncate rounded-md px-2.5 py-1.5 text-sm font-medium">
                                                            {BASE_MESSAGES.waitingAtStore}
                                                        </code>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 shrink-0 gap-1.5"
                                                            onClick={() => copyBaseLine(BASE_MESSAGES.waitingAtStore, 'wait')}
                                                        >
                                                            <Copy className="size-3.5" />
                                                            {copyFeedback === 'wait' ? 'Copiado' : 'Copiar'}
                                                        </Button>
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                                        <code className="bg-muted/80 max-w-full truncate rounded-md px-2.5 py-1.5 text-sm font-medium">
                                                            {BASE_MESSAGES.headingToDelivery}
                                                        </code>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 shrink-0 gap-1.5"
                                                            onClick={() => copyBaseLine(BASE_MESSAGES.headingToDelivery, 'route')}
                                                        >
                                                            <Copy className="size-3.5" />
                                                            {copyFeedback === 'route' ? 'Copiado' : 'Copiar'}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <label className="flex cursor-pointer items-start gap-3 pt-1">
                                                    <Checkbox
                                                        checked={baseStep2Done}
                                                        onCheckedChange={(c) => setBaseStep2Done(c === true)}
                                                        className="mt-0.5"
                                                        id="base-step-2"
                                                    />
                                                    <span className="text-sm leading-snug">Ya informé el seguimiento que tocaba (local o ruta)</span>
                                                </label>
                                            </li>

                                            <li className="border-border/80 bg-background/80 dark:bg-background/40 flex flex-col gap-3 rounded-xl border p-4">
                                                <div className="flex flex-wrap items-baseline gap-2">
                                                    <span className="text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold">
                                                        3
                                                    </span>
                                                    <span className="font-medium">Finalización</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <code className="bg-muted/80 text-foreground rounded-md px-2.5 py-1.5 text-sm font-medium">
                                                        {BASE_MESSAGES.delivered}
                                                    </code>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 gap-1.5"
                                                        onClick={() => copyBaseLine(BASE_MESSAGES.delivered, 'done')}
                                                    >
                                                        <Copy className="size-3.5" />
                                                        {copyFeedback === 'done' ? 'Copiado' : 'Copiar'}
                                                    </Button>
                                                </div>
                                                <label className="flex cursor-pointer items-start gap-3 pt-1">
                                                    <Checkbox
                                                        checked={baseStep3Done}
                                                        onCheckedChange={(c) => setBaseStep3Done(c === true)}
                                                        className="mt-0.5"
                                                        id="base-step-3"
                                                    />
                                                    <span className="text-sm leading-snug">Ya envié «Entregado» a la base</span>
                                                </label>
                                            </li>
                                        </ol>
                                    </div>
                                    <div className="mt-5 flex flex-col gap-3">{submitActions}</div>
                                </TabsContent>
                            </Tabs>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DriverAppLayout>
    );
}
