import InputError from '@/components/input-error';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Camera, ImageIcon } from 'lucide-react';
import { type ChangeEventHandler, useState } from 'react';

export type PlacePhotoPickerProps = {
    label: string;
    disabled?: boolean;
    photo: File | null;
    onPhotoChange: (file: File | null) => void;
    error?: string | null;
};

export function PlacePhotoPicker({ label, disabled, photo, onPhotoChange, error }: PlacePhotoPickerProps) {
    const [open, setOpen] = useState(false);

    const handlePick: ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0] ?? null;
        onPhotoChange(file);
        setOpen(false);
        e.target.value = '';
    };

    return (
        <div className="grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid gap-1">
                    <Label>{label}</Label>
                    {photo ? (
                        <p className="text-muted-foreground text-xs">Seleccionado: {photo.name}</p>
                    ) : (
                        <p className="text-muted-foreground text-xs hidden">Elige si quieres usar la cámara o una imagen ya guardada.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
                        {photo ? 'Cambiar foto…' : 'Elegir foto…'}
                    </Button>
                    {photo ? (
                        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onPhotoChange(null)}>
                            Quitar
                        </Button>
                    ) : null}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={cn(
                        // Móvil: hoja inferior ancha, por encima de la barra de navegación y con área segura.
                        'left-0 right-0 top-auto bottom-0 max-h-[min(88dvh,100%)] max-w-none translate-x-0 translate-y-0 gap-3 overflow-y-auto rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-4 pt-12 shadow-2xl sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:max-h-[85dvh] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6 sm:pt-6 sm:shadow-lg',
                        'pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]',
                    )}
                >
                    <DialogHeader className="space-y-2 pr-10 text-center sm:pr-0 sm:text-left">
                        <DialogTitle className="text-base sm:text-lg">Foto de fachada</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">¿Cómo quieres obtener la imagen?</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                        <label
                            className={cn(
                                buttonVariants({ variant: 'orange', size: 'default' }),
                                'flex min-h-14 w-full cursor-pointer flex-row items-center justify-start gap-3 py-3.5 text-left sm:min-h-10 sm:items-start sm:py-3',
                                disabled && 'pointer-events-none opacity-50',
                            )}
                        >
                            <Camera className="size-5 shrink-0 sm:mt-0.5" aria-hidden />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium sm:text-base">Cámara</span>
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="sr-only"
                                disabled={disabled}
                                onChange={handlePick}
                            />
                        </label>
                        <label
                            className={cn(
                                buttonVariants({ variant: 'purple', size: 'default' }),
                                'flex min-h-14 w-full cursor-pointer flex-row items-center justify-start gap-3 py-3.5 text-left sm:min-h-10 sm:items-start sm:py-3',
                                disabled && 'pointer-events-none opacity-50',
                            )}
                        >
                            <ImageIcon className="size-5 shrink-0 sm:mt-0.5" aria-hidden />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium sm:text-base">Galería o archivos</span>
                            </span>
                            <input type="file" accept="image/*" className="sr-only" disabled={disabled} onChange={handlePick} />
                        </label>
                    </div>
                </DialogContent>
            </Dialog>

            <InputError message={error ?? undefined} />
        </div>
    );
}
