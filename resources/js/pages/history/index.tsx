import DriverAppLayout from '@/layouts/driver-app-layout';
import { formatMxn } from '@/lib/format-mxn';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, History as HistoryIcon, Wallet } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Historial', href: '/history' },
];

export type HistorySessionRow = {
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
    needs_base_attention: boolean;
};

type PaginatorLink = { url: string | null; label: string; active: boolean };

type SessionsPaginator = {
    data: HistorySessionRow[];
    links: PaginatorLink[];
    current_page: number;
    last_page: number;
};

export default function HistoryIndex({ sessions }: { sessions: SessionsPaginator }) {
    const rows = sessions.data;

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial" />

            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Jornadas finalizadas y totales por día.</p>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
                        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                            <HistoryIcon className="text-muted-foreground size-7" />
                        </div>
                        <p className="text-muted-foreground max-w-xs text-sm">Aún no tienes jornadas cerradas. Cuando finalices una jornada, aparecerá aquí.</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {rows.map((session) => (
                            <li key={session.id}>
                                <Link
                                    href={route('history.work-session.show', session.id)}
                                    prefetch
                                    className={cn(
                                        'bg-card block rounded-2xl border p-4 shadow-sm transition',
                                        'hover:border-primary/30 hover:bg-muted/40',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Jornada</p>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                        session.needs_base_attention
                                                            ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
                                                            : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
                                                    )}
                                                >
                                                    {session.base_report_label}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-snug font-medium break-words">{session.period_label}</p>
                                            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                <span>
                                                    Servicios: <strong className="text-foreground">{session.services_count}</strong>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Wallet className="size-3.5" />
                                                    Inicio: <strong className="text-foreground">{formatMxn(session.initial_cash)}</strong>
                                                </span>
                                                {session.final_cash !== null ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Wallet className="size-3.5" />
                                                        Cierre: <strong className="text-foreground">{formatMxn(session.final_cash)}</strong>
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5 border-t pt-2 text-xs sm:grid-cols-3">
                                                <div>
                                                    <span className="text-muted-foreground">Envíos</span>
                                                    <p className="font-semibold tabular-nums">{formatMxn(session.sum_delivery)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Pedidos</span>
                                                    <p className="font-semibold tabular-nums">{formatMxn(session.sum_order)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Total (pedido+envío)</span>
                                                    <p className="font-semibold tabular-nums">{formatMxn(session.sum_total)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-muted-foreground mt-1 size-5 shrink-0" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {sessions.last_page > 1 ? (
                    <nav className="flex flex-wrap justify-center gap-1 pt-2" aria-label="Paginación">
                        {sessions.links.map((link, i) => {
                            const inner = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                            if (link.url) {
                                return (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        preserveScroll
                                        className={cn(
                                            'rounded-lg px-3 py-1.5 text-sm',
                                            link.active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80',
                                        )}
                                    >
                                        {inner}
                                    </Link>
                                );
                            }
                            return (
                                <span
                                    key={i}
                                    className={cn(
                                        'rounded-lg px-3 py-1.5 text-sm opacity-50',
                                        link.active && 'bg-primary text-primary-foreground opacity-100',
                                    )}
                                >
                                    {inner}
                                </span>
                            );
                        })}
                    </nav>
                ) : null}
            </div>
        </DriverAppLayout>
    );
}
