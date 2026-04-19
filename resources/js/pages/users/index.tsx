import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type ManagedUserRow, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Usuarios', href: '/users' },
];

type PaginatorLink = { url: string | null; label: string; active: boolean };

type UsersPaginator = {
    data: ManagedUserRow[];
    links: PaginatorLink[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
};

type UsersIndexProps = {
    users: UsersPaginator;
};

export default function UsersIndex({ users }: UsersIndexProps) {
    const { flash, auth } = usePage<SharedData & UsersIndexProps>().props;
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const rows = users.data;

    const destroyUser = (id: number) => {
        if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }
        setDeletingId(id);
        router.delete(route('users.destroy', id), {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const paginationSummary =
        users.from !== null && users.to !== null
            ? `Mostrando ${users.from}–${users.to} de ${users.total} usuario${users.total === 1 ? '' : 's'}`
            : `${users.total} usuario${users.total === 1 ? '' : 's'}`;

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />

            <div className="flex w-full min-w-0 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Administra cuentas, roles y estado de acceso.</p>
                    </div>
                    <Button asChild className="shrink-0">
                        <Link href={route('users.create')} prefetch>
                            <Plus className="mr-2 size-4" />
                            Nuevo usuario
                        </Link>
                    </Button>
                </div>

                {flash?.success ? (
                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                        <CheckCircle2 className="text-emerald-600" />
                        <AlertDescription className="text-emerald-900 dark:text-emerald-100">{flash.success}</AlertDescription>
                    </Alert>
                ) : null}

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
                        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                            <UsersIcon className="text-muted-foreground size-7" />
                        </div>
                        <p className="text-muted-foreground max-w-xs text-sm">No hay usuarios que coincidan. Crea el primero con «Nuevo usuario».</p>
                    </div>
                ) : (
                    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[8rem]">Nombre</TableHead>
                                    <TableHead className="min-w-[10rem]">Correo</TableHead>
                                    <TableHead className="hidden min-w-[7rem] md:table-cell">Teléfono</TableHead>
                                    <TableHead className="w-[1%] whitespace-nowrap">Rol</TableHead>
                                    <TableHead className="w-[1%] whitespace-nowrap">Estado</TableHead>
                                    <TableHead className="w-[1%] text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="max-w-[12rem] truncate font-medium">{row.name}</TableCell>
                                        <TableCell className="max-w-[14rem] truncate text-muted-foreground">{row.email}</TableCell>
                                        <TableCell className="hidden text-muted-foreground md:table-cell">
                                            {row.phone ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <span className="bg-primary/10 text-primary inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                                                {row.role_label}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                                                    row.status === 'active'
                                                        ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                                                        : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                {row.status_label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="outline" size="icon" className="size-8" asChild>
                                                    <Link href={route('users.edit', row.id)} prefetch aria-label={`Editar ${row.name}`}>
                                                        <Pencil className="size-3.5" />
                                                    </Link>
                                                </Button>
                                                {auth.user.id !== row.id ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 size-8"
                                                        aria-label={`Eliminar ${row.name}`}
                                                        disabled={deletingId === row.id}
                                                        onClick={() => destroyUser(row.id)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {rows.length > 0 ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <p className="text-muted-foreground text-center text-sm sm:text-left">{paginationSummary}</p>
                        {users.last_page > 1 ? (
                            <nav className="flex flex-wrap justify-center gap-1 sm:justify-end" aria-label="Paginación">
                                {users.links.map((link, i) => {
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
                ) : null}
            </div>
        </DriverAppLayout>
    );
}
