export type ApiValidationBody = {
    message?: string;
    errors?: Record<string, string[]>;
};

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: ApiValidationBody,
    ) {
        super(body.message ?? `Error HTTP ${status}`);
        this.name = 'ApiError';
    }
}

function readXsrfToken(): string | undefined {
    if (typeof document === 'undefined') {
        return undefined;
    }
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : undefined;
}

export type ApiFetchOptions = RequestInit & {
    csrfToken?: string;
};

/**
 * Petición JSON autenticada (sesión web + cookies). Compatible con rutas bajo `/api` en `web.php`.
 */
export async function apiJson<T>(input: RequestInfo | URL, init: ApiFetchOptions = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const xsrf = readXsrfToken();
    if (xsrf) {
        headers.set('X-XSRF-TOKEN', xsrf);
    }
    if (init.csrfToken) {
        headers.set('X-CSRF-TOKEN', init.csrfToken);
    }

    const res = await fetch(input, {
        credentials: 'same-origin',
        ...init,
        headers,
    });

    const data = (await res.json().catch(() => ({}))) as ApiValidationBody & T;

    if (!res.ok) {
        throw new ApiError(res.status, data);
    }

    return data as T;
}

/**
 * POST o PATCH multipart (p. ej. foto) con protección CSRF de sesión web.
 *
 * Nota: con `multipart/form-data`, muchos entornos no rellanan los campos del cuerpo en PATCH/PUT
 * (el servidor ve la petición vacía y Laravel responde "required"). Por eso PATCH se envía como
 * POST + `_method=PATCH` (igual que `@method('PATCH')` en Blade).
 */
export async function apiFormData<T>(
    url: string,
    formData: FormData,
    csrfToken: string,
    method: 'POST' | 'PATCH' = 'POST',
): Promise<T> {
    formData.append('_token', csrfToken);

    let httpMethod: 'POST' | 'PATCH' = method;
    if (method === 'PATCH') {
        formData.append('_method', 'PATCH');
        httpMethod = 'POST';
    }

    const headers = new Headers();
    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const xsrf = readXsrfToken();
    if (xsrf) {
        headers.set('X-XSRF-TOKEN', xsrf);
    }

    const res = await fetch(url, {
        method: httpMethod,
        credentials: 'same-origin',
        headers,
        body: formData,
    });

    const data = (await res.json().catch(() => ({}))) as ApiValidationBody & T;

    if (!res.ok) {
        throw new ApiError(res.status, data);
    }

    return data as T;
}
