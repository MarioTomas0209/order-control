import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { PlaceCategoryInput } from '@/components/place-category-input';
import { PlacePhotoPicker } from '@/components/place-photo-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DriverAppLayout from '@/layouts/driver-app-layout';
import { ApiError, apiFormData } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type PlaceDto, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';

type FormState = {
    name: string;
    category: string;
    phone: string;
    whatsapp: string;
    address: string;
    google_maps_link: string;
    latitude: string;
    longitude: string;
    notes: string;
};

function placeToFormState(place: PlaceDto): FormState {
    return {
        name: place.name,
        category: place.category,
        phone: place.phone ?? '',
        whatsapp: place.whatsapp ?? '',
        address: place.address,
        google_maps_link: place.google_maps_link,
        latitude: place.latitude != null ? String(place.latitude) : '',
        longitude: place.longitude != null ? String(place.longitude) : '',
        notes: place.notes ?? '',
    };
}

type PlacesEditProps = {
    place: PlaceDto;
};

export default function PlacesEdit({ place }: PlacesEditProps) {
    const { csrf_token } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Locales', href: '/places' },
        { title: place.name, href: route('places.edit', place.id) },
    ];

    const [data, setData] = useState<FormState>(() => placeToFormState(place));
    const [photo, setPhoto] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setMessage(null);

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category', data.category);
        formData.append('phone', data.phone);
        formData.append('whatsapp', data.whatsapp);
        formData.append('address', data.address);
        formData.append('google_maps_link', data.google_maps_link);
        if (data.latitude.trim() !== '') {
            formData.append('latitude', data.latitude.trim());
        }
        if (data.longitude.trim() !== '') {
            formData.append('longitude', data.longitude.trim());
        }
        formData.append('notes', data.notes);
        if (photo) {
            formData.append('photo', photo);
        }

        try {
            await apiFormData(route('api.places.update', place.id), formData, csrf_token, 'PATCH');
            router.visit(route('places.index'));
        } catch (err) {
            if (err instanceof ApiError && err.body.errors) {
                const flat: Record<string, string> = {};
                for (const [key, msgs] of Object.entries(err.body.errors)) {
                    flat[key] = msgs[0] ?? '';
                }
                setErrors(flat);
            } else if (err instanceof ApiError) {
                setMessage(err.message);
            } else {
                setMessage('No se pudieron guardar los cambios.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DriverAppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${place.name}`} />

            <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8 lg:max-w-xl">
                <div className="flex items-start justify-between gap-3">
                    <HeadingSmall title="Editar local" description="" />
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('places.index')} prefetch>
                            Volver
                        </Link>
                    </Button>
                </div>

                {message ? <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/30 px-3 py-2 text-sm">{message}</div> : null}

                <form onSubmit={(e) => void submit(e)} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del local</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} required maxLength={255} />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoría</Label>
                        <PlaceCategoryInput
                            id="category"
                            value={data.category}
                            onChange={(category) => setData((d) => ({ ...d, category }))}
                            disabled={processing}
                            placeholder="Ej. Taquería, farmacia, Oxxo…"
                            invalid={Boolean(errors.category)}
                            required
                        />
                        <InputError message={errors.category} />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Teléfono (opcional)</Label>
                            <Input id="phone" type="tel" value={data.phone} onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))} maxLength={40} />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                            <Input
                                id="whatsapp"
                                value={data.whatsapp}
                                onChange={(e) => setData((d) => ({ ...d, whatsapp: e.target.value }))}
                                placeholder="Con lada, ej. 5215512345678"
                                maxLength={40}
                            />
                            <InputError message={errors.whatsapp} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <textarea
                            id="address"
                            value={data.address}
                            onChange={(e) => setData((d) => ({ ...d, address: e.target.value }))}
                            required
                            rows={3}
                            maxLength={2000}
                            className={cn(
                                'flex min-h-[5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                            )}
                        />
                        <InputError message={errors.address} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="google_maps_link">Enlace de Google Maps</Label>
                        <Input
                            id="google_maps_link"
                            type="url"
                            value={data.google_maps_link}
                            onChange={(e) => setData((d) => ({ ...d, google_maps_link: e.target.value }))}
                            placeholder="https://maps.google.com/..."
                            required
                            maxLength={2000}
                        />
                        <InputError message={errors.google_maps_link} />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="latitude">Latitud (opcional)</Label>
                            <Input id="latitude" inputMode="decimal" value={data.latitude} onChange={(e) => setData((d) => ({ ...d, latitude: e.target.value }))} />
                            <InputError message={errors.latitude} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="longitude">Longitud (opcional)</Label>
                            <Input id="longitude" inputMode="decimal" value={data.longitude} onChange={(e) => setData((d) => ({ ...d, longitude: e.target.value }))} />
                            <InputError message={errors.longitude} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Foto actual</Label>
                        {place.photo_url ? (
                            <img src={place.photo_url} alt="" className="max-h-40 w-full max-w-xs rounded-lg border object-cover" />
                        ) : (
                            <p className="text-muted-foreground text-sm">Sin foto.</p>
                        )}
                    </div>

                    <PlacePhotoPicker
                        label="Nueva foto de fachada (opcional)"
                        photo={photo}
                        onPhotoChange={setPhoto}
                        disabled={processing}
                        error={errors.photo}
                    />

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
                            rows={3}
                            maxLength={5000}
                            className={cn(
                                'flex min-h-[5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                            )}
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="submit" disabled={processing} variant="yellow" className="w-full sm:w-auto">
                            Guardar cambios
                        </Button>
                        <Button type="button" variant="red" asChild className="w-full sm:w-auto">
                            <Link href={route('places.index')}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </DriverAppLayout>
    );
}
