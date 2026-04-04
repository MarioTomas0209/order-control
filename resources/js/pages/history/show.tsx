import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { formatMxn } from '@/lib/format-mxn';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { type FormEventHandler } from 'react';

export type HistoryServiceRow = {
    id: number;
    order_cost: number;
    delivery_cost: number;
    total_cost: number;
    payment_type: string;
    payment_label: string;
    notes: string | null;
    time_label: string;
    is_cancelled: boolean;
    order_lines: { label: string; amount: number }[];
};

type SessionSummary = {
    id: number;
    period_label: string;
    initial_cash: number;
    final_cash: number | null;
    services_count: number;
    sum_delivery: number;
    sum_order: number;
    sum_total: number;
    base_report_status: string;
    base_report_label: string;
    base_report_options: { value: string; label: string }[];
};

export default function HistoryShow({ session, services }: { session: SessionSummary; services: HistoryServiceRow[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Historial', href: '/history' },
        { title: 'Jornada', href: `/history/work-sessions/${session.id}` },
    ];

    const baseReportForm = useForm({
        base_report_status: session.base_report_status,
    });

    const submitBaseReport: FormEventHandler = (e) => {
        e.preventDefault();
        baseReportForm.patch(route('work-sessions.base-report.update', session.id), { preserveScroll: true });
    };

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detalle de jornada" />

            <div className="flex min-w-0 flex-col gap-5">
                <Link
                    href={route('history')}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="size-4" />
                    Volver al historial
                </Link>

                <div className="bg-card min-w-0 rounded-2xl border p-4 shadow-sm">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Periodo</p>
                    <p className="mt-1 text-sm font-medium leading-snug break-words">{session.period_label}</p>
                    <div className="mt-3 grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
                        <div>
                            <span className="text-muted-foreground">Dinero al iniciar</span>
                            <p className="font-semibold tabular-nums">{formatMxn(session.initial_cash)}</p>
                        </div>
                        {session.final_cash !== null ? (
                            <div>
                                <span className="text-muted-foreground">Efectivo al cerrar</span>
                                <p className="font-semibold tabular-nums">{formatMxn(session.final_cash)}</p>
                            </div>
                        ) : null}
                        <div>
                            <span className="text-muted-foreground">Servicios registrados</span>
                            <p className="font-semibold">{session.services_count}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Suma envíos</span>
                            <p className="font-semibold tabular-nums">{formatMxn(session.sum_delivery)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Suma pedidos</span>
                            <p className="font-semibold tabular-nums">{formatMxn(session.sum_order)}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <span className="text-muted-foreground">Suma total (pedido + envío)</span>
                            <p className="font-semibold tabular-nums">{formatMxn(session.sum_total)}</p>
                        </div>
                    </div>

                    <form onSubmit={submitBaseReport} className="mt-4 space-y-3 border-t pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="base_report_status" className="text-foreground">
                                Reporte de la base
                            </Label>
                            <select
                                id="base_report_status"
                                value={baseReportForm.data.base_report_status}
                                onChange={(e) => baseReportForm.setData('base_report_status', e.target.value)}
                                className={cn(
                                    'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full max-w-md rounded-md border px-3 py-2 text-sm',
                                    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                )}
                            >
                                {session.base_report_options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={baseReportForm.errors.base_report_status} />
                        </div>
                        <Button type="submit" variant="sky" size="sm" disabled={baseReportForm.processing}>
                            {baseReportForm.processing ? 'Guardando…' : 'Guardar estado'}
                        </Button>
                    </form>
                </div>

                <div>
                    <h2 className="text-lg font-semibold">Servicios del día</h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">Vista de todos los registros de esta jornada.</p>
                </div>

                {services.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay servicios en esta jornada.</p>
                ) : (
                    <div className="bg-card min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border shadow-sm [-webkit-overflow-scrolling:touch]">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Hora</th>
                                    <th className="px-3 py-2 font-medium">Pago</th>
                                    <th className="px-3 py-2 font-medium">Pedido</th>
                                    <th className="px-3 py-2 font-medium">Envío</th>
                                    <th className="px-3 py-2 font-medium">Total</th>
                                    <th className="px-3 py-2 font-medium">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={cn(
                                            'border-t',
                                            row.is_cancelled && 'bg-muted/30 text-muted-foreground',
                                        )}
                                    >
                                        <td className="text-muted-foreground whitespace-nowrap px-3 py-2">
                                            {row.time_label}
                                            {row.is_cancelled ? (
                                                <span className="ml-2 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 no-underline dark:text-amber-200">
                                                    Anulado
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.payment_label}</td>
                                        <td className="px-3 py-2 align-top tabular-nums">
                                            <div>{formatMxn(row.order_cost)}</div>
                                            {row.order_lines && row.order_lines.length > 0 ? (
                                                <ul className="text-muted-foreground mt-1 max-w-[14rem] space-y-0.5 text-xs">
                                                    {row.order_lines.map((line, i) => (
                                                        <li key={i}>
                                                            {line.label} · {formatMxn(line.amount)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">{formatMxn(row.delivery_cost)}</td>
                                        <td className="px-3 py-2 font-medium tabular-nums">{formatMxn(row.total_cost)}</td>
                                        <td className="max-w-[200px] px-3 py-2 text-xs break-words">{row.notes ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DriverAppLayout>
    );
}
