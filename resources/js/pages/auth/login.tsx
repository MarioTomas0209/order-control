import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, LoaderCircle, Truck } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { authFieldClass, authLabelClass } from '@/lib/auth-form-styles';
import AppLogoIcon from '@/components/app-logo-icon';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="bg-[#F9FAFB] dark:bg-background flex min-h-svh flex-col items-center justify-center px-4 py-10">
            <Head title="Iniciar sesión" />

            <div className="w-full max-w-md">
                <div className="mb-10 flex flex-col items-center text-center">
                    <div
                        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/50"
                        aria-hidden
                    >
                        <AppLogoIcon />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">SaaS</h1>
                    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                        Ingresa tu correo y contraseña para continuar.
                    </p>
                </div>

                {status ? (
                    <div className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 mb-6 rounded-xl border px-4 py-3 text-center text-sm font-medium text-green-800 dark:text-green-200">
                        {status}
                    </div>
                ) : null}

                <form className="flex flex-col gap-6" onSubmit={submit}>
                    <div className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <label htmlFor="email" className={authLabelClass}>
                                Correo electrónico
                            </label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
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
                            <div className="flex items-center justify-between gap-2">
                                <label htmlFor="password" className={authLabelClass}>
                                    Contraseña
                                </label>
                                {canResetPassword ? (
                                    <TextLink
                                        href={route('password.request')}
                                        tabIndex={5}
                                        className="text-xs font-semibold text-blue-600 no-underline hover:underline dark:text-blue-400"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </TextLink>
                                ) : null}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="••••••••"
                                className={authFieldClass}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-start gap-3 pt-1">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', checked === true)}
                                className="mt-0.5 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div className="grid gap-1 leading-snug">
                                <label htmlFor="remember" className="text-sm font-medium text-gray-700 dark:text-foreground">
                                    Mantener sesión en este dispositivo
                                </label>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        tabIndex={4}
                        disabled={processing}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {processing ? (
                            <LoaderCircle className="size-5 animate-spin" />
                        ) : (
                            <>
                                Iniciar sesión
                                <ArrowRight className="size-5 shrink-0" aria-hidden />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-muted-foreground mt-8 text-center text-sm">
                    ¿No tienes una cuenta?{' '}
                    <TextLink href={route('register')} tabIndex={6} className="font-semibold text-blue-600 dark:text-blue-400">
                        Crear cuenta
                    </TextLink>
                </p>
            </div>
        </div>
    );
}
