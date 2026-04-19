import { type PlaceDto } from '@/types';

export function openGoogleMaps(place: Pick<PlaceDto, 'latitude' | 'longitude' | 'google_maps_link'>): void {
    if (place.latitude != null && place.longitude != null) {
        window.open(`https://www.google.com/maps?q=${place.latitude},${place.longitude}`, '_blank', 'noopener,noreferrer');
        return;
    }
    window.open(place.google_maps_link, '_blank', 'noopener,noreferrer');
}

export function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

export function whatsappHref(whatsapp: string): string | null {
    const d = digitsOnly(whatsapp);
    return d.length > 0 ? `https://wa.me/${d}` : null;
}

export function telHref(phone: string): string | null {
    const d = digitsOnly(phone);
    return d.length > 0 ? `tel:${d}` : null;
}
