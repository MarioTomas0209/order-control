import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Facebook, Instagram, Phone, Truck } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="dark:bg-background dark:text-foreground bg-[#F9FAFB] text-gray-900">
            <Head title="SaaS" />

            <header className="dark:border-border dark:bg-background/80 border-b border-gray-200/80 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
                    <Link href={route('home')} className="flex min-w-0 shrink items-center gap-2.5 sm:min-h-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
                            <AppLogoIcon />
                        </div>
                        <span className="text-sm leading-tight font-semibold tracking-tight sm:text-base sm:leading-none">SaaS</span>
                    </Link>
                    <nav className="flex w-full min-w-0 gap-2 text-sm sm:w-auto sm:shrink-0 sm:justify-end">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 sm:flex-initial"
                            >
                                Ir al panel
                                <ArrowRight className="size-4 shrink-0" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 font-medium text-gray-800 hover:bg-gray-50 sm:flex-initial sm:px-4"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl bg-blue-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-blue-700 sm:flex-initial sm:px-4"
                                >
                                    Crear cuenta
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
                <section className="text-center">
                    <h1 className="text-primary mb-3 text-3xl font-bold tracking-tight sm:text-4xl">Para repartidores</h1>
                    <img src="/images/img-8.jpg" alt="SaaS" className="h-auto w-full rounded-xl" />
                    {!auth.user ? (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700"
                            >
                                Empezar gratis
                                <ArrowRight className="size-5" />
                            </Link>
                            <Link
                                href={route('login')}
                                className="text-muted-foreground hover:text-foreground rounded-xl px-4 py-3 text-base font-medium underline-offset-4 hover:underline"
                            >
                                Ya tengo cuenta
                            </Link>
                        </div>
                    ) : null}
                </section>
            </main>

            <footer className="dark:border-border dark:text-muted-foreground border-t border-gray-200 py-8 text-center text-sm text-gray-500">
                <p className="mb-4">SaaS · {new Date().getFullYear()}</p>
                <div className="flex flex-wrap items-center justify-center gap-5">
                    <a
                        href="https://www.facebook.com/marioadolfo.tomas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg text-gray-600 transition hover:text-[#1877F2] dark:text-gray-400 dark:hover:text-[#1877F2]"
                        aria-label="Facebook"
                    >
                        <Facebook className="size-5 shrink-0" strokeWidth={1.75} />
                        <span className="sr-only">Facebook</span>
                    </a>
                    <a
                        href="https://www.instagram.com/mariotomas02/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg text-gray-600 transition hover:text-[#E4405F] dark:text-gray-400 dark:hover:text-[#E4405F]"
                        aria-label="Instagram"
                    >
                        <Instagram className="size-5 shrink-0" strokeWidth={1.75} />
                        <span className="sr-only">Instagram</span>
                    </a>
                    <a
                        href="https://wa.me/529632525351"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg text-gray-600 transition hover:text-[#25D366] dark:text-gray-400 dark:hover:text-[#25D366]"
                        aria-label="WhatsApp"
                    >
                        <Phone className="size-5 shrink-0" strokeWidth={1.75} />
                        <span className="sr-only">WhatsApp</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}
