import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, LoaderCircle, Truck } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authFieldClass, authLabelClass } from '@/lib/auth-form-styles';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="bg-[#F9FAFB] dark:bg-background flex min-h-svh flex-col items-center justify-center px-4 py-10">
            <Head title="Registro" />

            <div className="w-full max-w-md">
                <div className="mb-10 flex flex-col items-center text-center">
                    <div
                        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/50"
                        aria-hidden
                    >
                        <Truck className="size-8 text-sky-700 dark:text-sky-400" strokeWidth={2} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">Control de Repartos</h1>
                </div>

                <form className="flex flex-col gap-6" onSubmit={submit}>
                    <div className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <label htmlFor="name" className={authLabelClass}>
                                Nombre completo
                            </label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                                placeholder="claudia sheinbaum"
                                className={authFieldClass}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="email" className={authLabelClass}>
                                Correo electrónico
                            </label>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={processing}
                                placeholder="email@ejemplo.com"
                                className={authFieldClass}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="phone" className={authLabelClass}>
                                Teléfono
                            </label>
                            <Input
                                id="phone"
                                type="tel"
                                required
                                tabIndex={3}
                                autoComplete="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                disabled={processing}
                                placeholder="+52 000 000 0000"
                                className={authFieldClass}
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="password" className={authLabelClass}>
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="••••••••"
                                className={authFieldClass}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="password_confirmation" className={authLabelClass}>
                                Confirmar contraseña
                            </label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                tabIndex={5}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder="••••••••"
                                className={authFieldClass}
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        tabIndex={6}
                        disabled={processing}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {processing ? (
                            <LoaderCircle className="size-5 animate-spin" />
                        ) : (
                            <>
                                Crear cuenta
                                <ArrowRight className="size-5 shrink-0" aria-hidden />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-muted-foreground mt-8 text-center text-sm">
                    ¿Ya tienes una cuenta?{' '}
                    <TextLink href={route('login')} tabIndex={7} className="font-semibold text-blue-600 dark:text-blue-400">
                        Iniciar sesión
                    </TextLink>
                </p>
            </div>
        </div>
    );
}
