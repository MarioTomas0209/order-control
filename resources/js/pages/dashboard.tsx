import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { copyServiceAmountsToClipboard } from '@/lib/copy-service-amounts';
import { formatMxn } from '@/lib/format-mxn';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Coffee, Copy, History, Info, LogOut, Package, Pencil, Play, Plus, Trash2, Truck, Wallet } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

type ActiveWorkSession = {
    id: number;
    start_time: string;
    start_label: string;
    initial_cash: number;
    on_break: boolean;
};

type LastService = {
    at: string;
    label: string;
    payment_label: string;
};

type SessionServiceRow = {
    id: number;
    order_cost: number;
    delivery_cost: number;
    total_cost: number;
    payment_label: string;
    time_label: string;
    notes: string | null;
    order_lines: { label: string; amount: number }[];
};

type DashboardProps = {
    activeWorkSession: ActiveWorkSession | null;
    stats: {
        services_count: number;
        total_deliveries: number;
    };
    sessionServices: SessionServiceRow[];
    lastService: LastService | null;
};

export default function Dashboard() {
    const { auth, activeWorkSession, stats, sessionServices, lastService } = usePage<SharedData & DashboardProps>().props;
    const [processing, setProcessing] = useState(false);
    const [endOpen, setEndOpen] = useState(false);
    const [copiedServiceId, setCopiedServiceId] = useState<number | null>(null);

    const startForm = useForm({
        initial_cash: '',
    });

    const endForm = useForm({
        final_cash: '',
    });

    const submitStart: FormEventHandler = (e) => {
        e.preventDefault();
        startForm.post(route('work-sessions.store'), {
            preserveScroll: true,
        });
    };

    const postSession = (url: string) => {
        setProcessing(true);
        router.post(
            url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const submitEnd: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeWorkSession) {
            return;
        }
        endForm.post(route('work-sessions.end', activeWorkSession.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEndOpen(false);
                endForm.reset('final_cash');
            },
        });
    };

    const cancelService = (id: number) => {
        if (!confirm('¿Anular este servicio? Dejará de contar en los totales de la jornada.')) {
            return;
        }
        setProcessing(true);
        router.post(
            route('services.cancel', id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const copyRowAmounts = async (row: SessionServiceRow) => {
        const lines = row.order_lines?.length ? row.order_lines : null;
        const ok = await copyServiceAmountsToClipboard(row.order_cost, row.delivery_cost, row.total_cost, lines);
        if (ok) {
            setCopiedServiceId(row.id);
            window.setTimeout(() => setCopiedServiceId(null), 2000);
        }
    };

    const firstName = auth.user.name.split(' ')[0] ?? auth.user.name;

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-5">
                {activeWorkSession ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <span className="bg-primary/12 text-primary inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                                <span className="bg-primary size-1.5 rounded-full" aria-hidden />
                                {activeWorkSession.start_label}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">Hola, {firstName}</h1>
                                {activeWorkSession.on_break ? (
                                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                                        En descanso
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {activeWorkSession.on_break
                                    ? 'Cuando termines, reanuda la jornada para seguir registrando servicios.'
                                    : 'Tu jornada está activa. Buen reparto.'}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Efectivo al iniciar:{' '}
                                <strong className="text-foreground tabular-nums">{formatMxn(activeWorkSession.initial_cash)}</strong>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="border-0 shadow-md">
                                <CardContent className="flex flex-col gap-2 p-4">
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                                        <Truck className="size-4" />
                                        Servicios
                                    </div>
                                    <p className="text-3xl font-bold tabular-nums">{stats.services_count}</p>
                                    <p className="text-muted-foreground text-xs">En esta jornada</p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 bg-sky-600 text-white shadow-md dark:bg-sky-900">
                                <CardContent className="flex flex-col gap-2 p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-white/90 uppercase">
                                        <Wallet className="size-4" />
                                        Total envíos
                                    </div>
                                    <p className="text-lg font-bold text-white tabular-nums">{formatMxn(stats.total_deliveries)}</p>
                                    <p className="text-xs text-white/80">Acumulado en la jornada</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {activeWorkSession.on_break ? (
                                <Button
                                    className="h-12 rounded-xl text-base shadow-md"
                                    size="lg"
                                    variant="blue"
                                    type="button"
                                    disabled
                                    title="Reanuda la jornada para poder registrar servicios"
                                >
                                    <Plus className="mr-2 size-5" />
                                    Nuevo servicio
                                </Button>
                            ) : (
                                <Button className="h-12 rounded-xl text-base shadow-md" size="lg" variant="blue" asChild>
                                    <Link href={route('services.create')} prefetch>
                                        <Plus className="mr-2 size-5" />
                                        Nuevo servicio
                                    </Link>
                                </Button>
                            )}
                            {activeWorkSession.on_break ? (
                                <Button
                                    className="h-12 rounded-xl text-base shadow-md"
                                    size="lg"
                                    type="button"
                                    variant="green"
                                    disabled={processing}
                                    onClick={() => postSession(route('work-sessions.resume', activeWorkSession.id))}
                                >
                                    <Play className="mr-2 size-5 fill-current" />
                                    Reanudar
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="bg-muted text-foreground hover:bg-muted/80 h-12 rounded-xl text-base"
                                    size="lg"
                                    type="button"
                                    disabled={processing}
                                    onClick={() => postSession(route('work-sessions.break', activeWorkSession.id))}
                                >
                                    <Coffee className="mr-2 size-5" />
                                    Tomar descanso
                                </Button>
                            )}
                            {endOpen ? (
                                <Card className="border-destructive/20 bg-destructive/5 border shadow-md">
                                    <CardContent className="flex flex-col gap-4 p-4">
                                        <div>
                                            <h2 className="text-base font-semibold">Cerrar jornada</h2>
                                        </div>
                                        <form onSubmit={submitEnd} className="flex flex-col gap-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="final_cash">Efectivo al cerrar</Label>
                                                <Input
                                                    id="final_cash"
                                                    type="number"
                                                    inputMode="decimal"
                                                    min={0}
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="text-lg"
                                                    value={endForm.data.final_cash}
                                                    onChange={(e) => endForm.setData('final_cash', e.target.value)}
                                                    required
                                                    autoComplete="off"
                                                />
                                                <InputError message={endForm.errors.final_cash} />
                                            </div>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-11 flex-1 rounded-xl"
                                                    disabled={endForm.processing}
                                                    onClick={() => {
                                                        setEndOpen(false);
                                                        endForm.clearErrors();
                                                    }}
                                                >
                                                    Volver
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="destructive"
                                                    className="h-11 flex-1 rounded-xl"
                                                    disabled={endForm.processing}
                                                >
                                                    <LogOut className="mr-2 size-5" />
                                                    Confirmar cierre
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 h-12 rounded-xl text-base"
                                    size="lg"
                                    type="button"
                                    disabled={processing}
                                    onClick={() => setEndOpen(true)}
                                >
                                    <LogOut className="mr-2 size-5" />
                                    Finalizar jornada
                                </Button>
                            )}

                            {sessionServices.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Servicios de hoy</h2>
                                    <ul className="flex flex-col gap-2">
                                        {sessionServices.map((row) => (
                                            <li key={row.id} className="bg-card flex flex-col gap-2 rounded-xl border p-3 text-sm shadow-sm">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">{row.time_label}</p>
                                                        <p className="font-medium tabular-nums">
                                                            {formatMxn(row.total_cost)}
                                                            <span className="text-muted-foreground ml-2 font-normal">
                                                                ({formatMxn(row.order_cost)} pedido + {formatMxn(row.delivery_cost)} envío)
                                                            </span>
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">{row.payment_label}</p>
                                                        {row.order_lines && row.order_lines.length > 0 ? (
                                                            <ul className="border-muted mt-2 space-y-0.5 border-l-2 pl-2 text-xs">
                                                                {row.order_lines.map((line, i) => (
                                                                    <li key={i} className="text-muted-foreground">
                                                                        <span className="text-foreground">{line.label}</span>{' '}
                                                                        <span className="tabular-nums">{formatMxn(line.amount)}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : null}
                                                        {row.notes ? <p className="mt-1 text-xs break-words">{row.notes}</p> : null}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 border-t pt-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 gap-1.5 rounded-lg"
                                                            type="button"
                                                            onClick={() => copyRowAmounts(row)}
                                                        >
                                                            <Copy className="size-3.5" />
                                                            {copiedServiceId === row.id ? 'Copiado' : 'Copiar montos'}
                                                        </Button>
                                                        {activeWorkSession.on_break ? null : (
                                                            <>
                                                                <Button variant="outline" size="sm" className="h-9 rounded-lg" asChild>
                                                                    <Link href={route('services.edit', row.id)} prefetch>
                                                                        <Pencil className="mr-1.5 size-3.5" />
                                                                        Editar
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive h-9 rounded-lg"
                                                                    type="button"
                                                                    disabled={processing}
                                                                    onClick={() => cancelService(row.id)}
                                                                >
                                                                    <Trash2 className="mr-1.5 size-3.5" />
                                                                    Anular
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                    {activeWorkSession.on_break ? (
                                                        <p className="text-muted-foreground text-xs">Reanuda la jornada para editar o anular.</p>
                                                    ) : null}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Estado actual</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight">Jornada: No iniciada</h1>
                        </div>

                        <Card className="border-0 shadow-md">
                            <CardContent className="flex flex-col gap-4 p-5">
                                <div>
                                    <h2 className="text-lg font-semibold">¿Listo para el turno?</h2>
                                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                        Inicia tu jornada para comenzar a registrar servicios de entrega.
                                    </p>
                                </div>
                                <form onSubmit={submitStart} className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="initial_cash">Dinero disponible</Label>
                                        <Input
                                            id="initial_cash"
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step="0.01"
                                            placeholder="0.00"
                                            className="text-lg"
                                            value={startForm.data.initial_cash}
                                            onChange={(e) => startForm.setData('initial_cash', e.target.value)}
                                            required
                                            autoComplete="off"
                                        />
                                        <InputError message={startForm.errors.initial_cash} />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 rounded-xl text-base shadow-md"
                                        size="lg"
                                        disabled={startForm.processing}
                                        variant="sky"
                                    >
                                        <Play className="mr-2 size-5 fill-current" />
                                        Iniciar jornada
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="border-muted-foreground/20 shadow-sm">
                                <CardContent className="flex flex-col gap-1 p-4">
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                                        <Package className="size-4" />
                                        Servicios hoy
                                    </div>
                                    <p className="text-3xl font-bold tabular-nums">0</p>
                                </CardContent>
                            </Card>
                            <Card className="border-muted-foreground/20 shadow-sm">
                                <CardContent className="flex flex-col gap-1 p-4">
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                                        <Wallet className="size-4" />
                                        Total envíos
                                    </div>
                                    <p className="text-3xl font-bold tabular-nums">{formatMxn(0)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <button
                            type="button"
                            className="bg-card text-card-foreground hover:bg-muted/50 flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition"
                        >
                            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                                <History className="text-muted-foreground size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">Sin actividad reciente</p>
                                <p className="text-muted-foreground text-xs">
                                    {lastService
                                        ? `Último servicio: ${lastService.label} · ${lastService.payment_label}`
                                        : 'Aún no registras servicios'}
                                </p>
                            </div>
                        </button>

                        <div
                            className={cn('flex gap-3 rounded-2xl border border-sky-200/80 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/40')}
                        >
                            <Info className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />
                            <p className="text-sm leading-snug text-sky-900 dark:text-sky-100">
                                Revisa tu vehículo y el nivel de combustible antes de iniciar la ruta.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </DriverAppLayout>
    );
}
