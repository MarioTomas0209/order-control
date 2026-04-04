import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'pwa-install-dismiss-until';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneDisplay(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function isDismissCooldownActive(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return false;
        }
        const until = parseInt(raw, 10);
        if (Number.isNaN(until)) {
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }
        return Date.now() < until;
    } catch {
        return false;
    }
}

function saveDismissCooldown(): void {
    try {
        localStorage.setItem(STORAGE_KEY, String(Date.now() + COOLDOWN_MS));
    } catch {
        // ignore
    }
}

type BeforeInstallPromptEventLike = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallBanner() {
    const [open, setOpen] = useState(false);
    const deferredRef = useRef<BeforeInstallPromptEventLike | null>(null);

    const hide = useCallback(() => {
        setOpen(false);
        deferredRef.current = null;
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        if (isStandaloneDisplay()) {
            return;
        }

        const onBeforeInstall = (e: Event) => {
            if (isStandaloneDisplay()) {
                return;
            }
            if (isDismissCooldownActive()) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            deferredRef.current = e as BeforeInstallPromptEventLike;
            setOpen(true);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    const handleInstall = async () => {
        const ev = deferredRef.current;
        if (!ev) {
            return;
        }
        try {
            await ev.prompt();
            await ev.userChoice;
        } catch {
            // ignore
        }
        hide();
    };

    const handleLater = () => {
        saveDismissCooldown();
        hide();
    };

    if (!open) {
        return null;
    }

    return (
        <div
            className="animate-in slide-in-from-bottom-4 fixed inset-x-0 bottom-0 z-[100] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] duration-300 md:left-auto md:right-4 md:max-w-md md:p-0"
            role="dialog"
            aria-label="Instalar aplicación"
        >
            <Alert className="border-sky-300/80 bg-background/95 text-foreground shadow-lg backdrop-blur-md dark:border-sky-500/40">
                <Download className="size-5 text-sky-600 dark:text-sky-400" aria-hidden />
                <AlertTitle className="text-base">Instalar aplicación</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                    <p className="text-muted-foreground">
                        Instala la app en tu celular para abrirla más rápido y usarla como una aplicación normal.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={handleInstall}>
                            Instalar
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={handleLater}>
                            Ahora no
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
}
