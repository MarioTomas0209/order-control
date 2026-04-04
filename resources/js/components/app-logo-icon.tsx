import { Truck } from 'lucide-react';

export default function AppLogoIcon() {
    return (
        <div className="flex size-14 items-center p-4 justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/50" aria-hidden>
            <Truck className="size-10 text-sky-700 dark:text-sky-400" strokeWidth={2} />
        </div>
    );
}
