import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { ApiError, apiJson } from '@/lib/api-client';
import { openGoogleMaps, telHref, whatsappHref } from '@/lib/places-urls';
import { type BreadcrumbItem, type PaginatedPlacesResponse, type PlaceDto, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, Check, Info, MapPin, MessageCircle, Pencil, Phone, Plus, Search, StickyNote, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Locales', href: '/places' },
];

type TabValue = 'approved' | 'pending';

export default function PlacesIndex() {
    const { auth, csrf_token, pendingPlaceSuggestionNotificationsCount, unreadPlaceRejectedNotificationsCount } =
        usePage<SharedData>().props;
    const isAdmin = auth.user.role === 'admin';
    const canEditAnyPlace = auth.user.role === 'admin';

    const [tab, setTab] = useState<TabValue>('approved');
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [places, setPlaces] = useState<PlaceDto[]>([]);
    const [pagination, setPagination] = useState<PaginatedPlacesResponse['meta'] | null>(null);
    const [links, setLinks] = useState<PaginatedPlacesResponse['links'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 320);
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    const loadApproved = useCallback(
        async (pageUrl?: string) => {
            setLoading(true);
            setError(null);
            try {
                let url = pageUrl ?? route('api.places.index');
                if (!pageUrl && debouncedQuery.length > 0) {
                    url = `${route('api.places.search')}?${new URLSearchParams({ q: debouncedQuery })}`;
                }
                const res = await apiJson<PaginatedPlacesResponse>(url, { csrfToken: csrf_token });
                setPlaces(res.data);
                setPagination(res.meta);
                setLinks(res.links);
            } catch (e) {
                setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los locales.');
                setPlaces([]);
                setPagination(null);
                setLinks(null);
            } finally {
                setLoading(false);
            }
        },
        [csrf_token, debouncedQuery],
    );

    const loadPending = useCallback(
        async (pageUrl?: string) => {
            setLoading(true);
            setError(null);
            try {
                const url = pageUrl ?? route('api.places.pending');
                const res = await apiJson<PaginatedPlacesResponse>(url, { csrfToken: csrf_token });
                setPlaces(res.data);
                setPagination(res.meta);
                setLinks(res.links);
            } catch (e) {
                setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las sugerencias pendientes.');
                setPlaces([]);
                setPagination(null);
                setLinks(null);
            } finally {
                setLoading(false);
            }
        },
        [csrf_token],
    );

    useEffect(() => {
        if (tab === 'approved') {
            void loadApproved();
        } else if (tab === 'pending') {
            void loadPending();
        }
    }, [tab, loadApproved, loadPending]);

    const approvePlace = async (place: PlaceDto) => {
        setActionId(place.id);
        try {
            await apiJson<{ message: string }>(route('api.places.approve', place.id), {
                method: 'POST',
                csrfToken: csrf_token,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            await loadPending();
            router.reload({ preserveScroll: true });
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'No se pudo aprobar.');
        } finally {
            setActionId(null);
        }
    };

    const rejectPlace = async (place: PlaceDto) => {
        if (!confirm(`¿Rechazar la sugerencia «${place.name}»?`)) {
            return;
        }
        setActionId(place.id);
        try {
            await apiJson<{ message: string }>(route('api.places.reject', place.id), {
                method: 'POST',
                csrfToken: csrf_token,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            await loadPending();
            router.reload({ preserveScroll: true });
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'No se pudo rechazar.');
        } finally {
            setActionId(null);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setDebouncedQuery('');
    };

    const loadPage = (url: string | null) => {
        if (!url) {
            return;
        }
        if (tab === 'approved') {
            void loadApproved(url);
        } else {
            void loadPending(url);
        }
    };

    const approvedSection = (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre o categoría…"
                    className="pl-9 pr-10"
                    aria-label="Buscar locales"
                />
                {query ? (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1"
                        aria-label="Limpiar búsqueda"
                    >
                        <X className="size-4" />
                    </button>
                ) : null}
            </div>

            {loading && tab === 'approved' ? <p className="text-muted-foreground text-sm">Cargando…</p> : null}

            {!loading && tab === 'approved' && places.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
                    {debouncedQuery ? 'Sin resultados para esa búsqueda.' : 'Aún no hay locales aprobados.'}
                </div>
            ) : null}

            {!loading && tab === 'approved'
                ? places.map((place) => <PlaceCard key={place.id} place={place} variant="approved" showEdit={canEditAnyPlace} />)
                : null}
        </div>
    );

    const pendingSection = (
        <div className="flex flex-col gap-4">
            {loading && tab === 'pending' ? <p className="text-muted-foreground text-sm">Cargando…</p> : null}
            {!loading && tab === 'pending' && places.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
                    {isAdmin ? 'No hay sugerencias pendientes.' : 'No tienes sugerencias pendientes.'}
                </div>
            ) : null}
            {!loading && tab === 'pending'
                ? places.map((place) => (
                      <PlaceCard
                          key={place.id}
                          place={place}
                          variant={isAdmin ? 'pending' : 'my_pending'}
                          showEdit={isAdmin ? canEditAnyPlace : true}
                          busy={actionId === place.id}
                          onApprove={isAdmin ? () => void approvePlace(place) : undefined}
                          onReject={isAdmin ? () => void rejectPlace(place) : undefined}
                      />
                  ))
                : null}
        </div>
    );

    const paginationBlock =
        !loading && links && pagination && pagination.last_page > 1 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-center text-sm sm:text-left">
                    Página {pagination.current_page} de {pagination.last_page} · {pagination.total} en total
                </p>
                <div className="flex justify-center gap-2 sm:justify-end">
                    <Button type="button" variant="outline" size="sm" disabled={!links.prev} onClick={() => loadPage(links.prev)}>
                        Anterior
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!links.next} onClick={() => loadPage(links.next)}>
                        Siguiente
                    </Button>
                </div>
            </div>
        ) : null;

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locales" />

            <div className="relative flex w-full min-w-0 flex-col gap-4 pb-24">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Locales</h1>
                </div>

                {error ? (
                    <div className="bg-destructive/10 text-destructive rounded-xl border border-destructive/30 px-3 py-2 text-sm">{error}</div>
                ) : null}

                {isAdmin && pendingPlaceSuggestionNotificationsCount > 0 ? (
                    <Alert className="border-amber-500/40 bg-amber-500/10">
                        <Bell className="size-4 text-amber-700 dark:text-amber-300" />
                        <AlertDescription className="flex flex-col gap-2 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:text-amber-100">
                            <span>
                                Tienes{' '}
                                <strong>
                                    {pendingPlaceSuggestionNotificationsCount} sugerencia
                                    {pendingPlaceSuggestionNotificationsCount === 1 ? '' : 's'}
                                </strong>{' '}
                                de local sin revisar.
                            </span>
                            <Button type="button" size="sm" variant="blue" className="shrink-0" onClick={() => setTab('pending')}>
                                Ver pendientes
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : null}

                {!isAdmin && (unreadPlaceRejectedNotificationsCount ?? 0) > 0 ? (
                    <Alert className="border-sky-500/40 bg-sky-500/10">
                        <Info className="size-4 text-sky-800 dark:text-sky-200" />
                        <AlertDescription className="flex flex-col gap-2 text-sky-950 sm:flex-row sm:items-center sm:justify-between dark:text-sky-100">
                            <span>
                                {(unreadPlaceRejectedNotificationsCount ?? 0) === 1
                                    ? 'Una de tus sugerencias de local no fue aprobada.'
                                    : `Tienes ${unreadPlaceRejectedNotificationsCount} avisos sobre sugerencias no aprobadas.`}
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0 border-sky-700/40 bg-white/80 dark:bg-sky-950/40"
                                onClick={() => router.post(route('notifications.place-rejected.dismiss'))}
                            >
                                Entendido
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : null}

                <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="approved">{isAdmin ? 'Aprobados' : 'Locales'}</TabsTrigger>
                        <TabsTrigger value="pending">{isAdmin ? 'Pendientes' : 'Mis pendientes'}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="approved" className="mt-4 flex flex-col gap-4">
                        {approvedSection}
                        {tab === 'approved' ? paginationBlock : null}
                    </TabsContent>
                    <TabsContent value="pending" className="mt-4 flex flex-col gap-4">
                        {pendingSection}
                        {tab === 'pending' ? paginationBlock : null}
                    </TabsContent>
                </Tabs>

                <Link
                    href={route('places.create')}
                    prefetch
                    className="bg-primary text-primary-foreground hover:bg-primary/90 fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8 lg:right-8"
                    aria-label="Agregar local"
                    style={{
                        backgroundColor: '#FF8C00',
                        color: '#FFFFFF',
                    }}
                >
                    <Plus className="size-7" strokeWidth={2.25} />
                </Link>
            </div>
        </DriverAppLayout>
    );
}

function PlaceCard({
    place,
    variant,
    showEdit,
    busy,
    onApprove,
    onReject,
}: {
    place: PlaceDto;
    variant: 'approved' | 'pending' | 'my_pending';
    showEdit?: boolean;
    busy?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
}) {
    const tel = place.phone ? telHref(place.phone) : null;
    const wa = place.whatsapp ? whatsappHref(place.whatsapp) : null;

    return (
        <article className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
            {place.photo_url ? (
                <img src={place.photo_url} alt="" className="aspect-video w-full max-h-44 rounded-xl object-cover" loading="lazy" />
            ) : null}
            <div className="space-y-1">
                <h2 className="text-lg leading-tight font-semibold">{place.name}</h2>
                <p className="text-muted-foreground text-sm font-medium">{place.category}</p>
                <p className="text-sm leading-snug break-words">{place.address}</p>
                {variant === 'pending' && place.creator_name ? (
                    <p className="text-muted-foreground text-xs">Sugerido por: {place.creator_name}</p>
                ) : null}
                {variant === 'my_pending' ? (
                    <p className="text-muted-foreground text-xs">Pendiente de revisión; puedes editarla mientras tanto.</p>
                ) : null}
            </div>

            {(place.notes ?? '').trim() ? (
                <div className="bg-muted/50 border-border/80 text-foreground/90 rounded-xl border px-3 py-2 text-xs leading-relaxed">
                    <p className="text-foreground mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
                        <StickyNote className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        Notas
                    </p>
                    <p className="whitespace-pre-wrap break-words">{place.notes}</p>
                </div>
            ) : null}

            {showEdit ? (
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="orange" className="gap-1.5" asChild>
                        <Link href={route('places.edit', place.id)} prefetch>
                            <Pencil className="size-4 shrink-0" />
                        </Link>
                    </Button>
                </div>
            ) : null}

            {variant === 'approved' || variant === 'my_pending' ? (
                <div className="flex flex-wrap gap-2 justify-end">
                    <Button type="button" size="sm" variant="orange" className="gap-1.5" onClick={() => openGoogleMaps(place)}>
                        <MapPin className="size-4 shrink-0" />
                    </Button>
                    {tel ? (
                        <Button type="button" size="sm" variant="indigo" className="gap-1.5" asChild>
                            <a href={tel}>
                                <Phone className="size-4 shrink-0" />
                            </a>
                        </Button>
                    ) : null}
                    {wa ? (
                        <Button type="button" size="sm" variant="teal" className="gap-1.5" asChild>
                            <a href={wa} target="_blank" rel="noreferrer">
                                <MessageCircle className="size-4 shrink-0" />
                            </a>
                        </Button>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="green" className="gap-1" disabled={busy} onClick={onApprove}>
                        <Check className="size-4" />
                        Aprobar
                    </Button>
                    <Button type="button" size="sm" variant="destructive" className="gap-1" disabled={busy} onClick={onReject}>
                        <X className="size-4" />
                        Rechazar
                    </Button>
                </div>
            )}
        </article>
    );
}
