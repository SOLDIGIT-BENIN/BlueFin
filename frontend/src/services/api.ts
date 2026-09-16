// services/api.ts - Version complète

import axios from 'axios';

axios.defaults.withCredentials = true;

const isDev = import.meta.env.DEV;
const API_DOMAIN = (import.meta.env.VITE_API_URL || 'https://api.bluefin-immo.com').replace(/\/$/, '');

// ✅ En développement on garde le proxy Vite pour Sanctum et le backend.
// En production, on pointe explicitement vers le domaine API Laravel pour éviter les rewrites du front.
const BASE_URL = isDev ? '' : API_DOMAIN;
const PUBLIC_API_URL = isDev ? '' : API_DOMAIN;
const V1_API_URL = isDev ? '/api/v1' : `${API_DOMAIN}/api/v1`;
const CSRF_URL = isDev ? '/sanctum/csrf-cookie' : `${API_DOMAIN}/sanctum/csrf-cookie`;

console.log('🌐 Mode:', isDev ? 'DÉVELOPPEMENT (proxy)' : 'PRODUCTION');
console.log('🌐 API BASE URL:', BASE_URL || 'Proxy Vite');
console.log('🌐 CSRF URL:', CSRF_URL);

// ============================================
// ✅ FONCTIONS COOKIES
// ============================================

/**
 * Toutes les valeurs portant ce nom de cookie.
 *
 * Il peut y en avoir plusieurs : le navigateur autorise deux cookies de même
 * nom s'ils diffèrent par le domaine ou le chemin (par exemple un ancien
 * XSRF-TOKEN posé sur `.bluefin-immo.com` et le nouveau sur le domaine exact).
 * Il les envoie alors tous les deux, sans dire lequel est lequel.
 */
function getCookies(name: string): string[] {
    return document.cookie
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.startsWith(`${name}=`))
        .map((part) => {
            const raw = part.slice(name.length + 1);
            try {
                return decodeURIComponent(raw);
            } catch {
                return raw;
            }
        })
        .filter(Boolean);
}

export function getCookie(name: string): string | null {
    // Le doublon est précisément le cas qui cassait : l'ancienne version
    // découpait `document.cookie` et renvoyait null dès qu'un nom apparaissait
    // deux fois. Le jeton CSRF devenait alors introuvable, la requête partait
    // sans en-tête, Laravel répondait « CSRF token mismatch » - et la logique
    // de reprise abandonnait, faute de jeton à renvoyer.
    const values = getCookies(name);
    return values.length ? values[values.length - 1] : null;
}

export function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function deleteAllCookies(): void {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        deleteCookie(name.trim());
    }
}

// ============================================
// ✅ CONFIGURATION AXIOS
// ============================================

const baseConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    timeout: 30000,
};

export const publicApi = axios.create({
    baseURL: PUBLIC_API_URL,
    ...baseConfig,
});

export const v1Api = axios.create({
    baseURL: V1_API_URL,
    ...baseConfig,
});

let csrfRefreshPromise: Promise<boolean> | null = null;

const isAuthBypassEndpoint = (_url?: string): boolean => {
    return false;
};

// ============================================
// ✅ INTERCEPTEURS
// ============================================

const addCsrfToken = async (config: any) => {
    const skipCsrf = Boolean(config?.skipCsrf) || isAuthBypassEndpoint(config?.url);
    if (skipCsrf) {
        return config;
    }

    let cookieToken = getCookie('XSRF-TOKEN');
    if (!cookieToken) {
        await refreshCsrfToken();
        cookieToken = getCookie('XSRF-TOKEN');
    }

    // On pose l'en-tête nous-mêmes plutôt que de compter sur le comportement
    // automatique d'axios : celui-ci ne lit qu'un seul cookie, et ne s'applique
    // pas dans toutes les configurations d'origine.
    if (cookieToken) {
        config.headers = config.headers || {};
        config.headers['X-XSRF-TOKEN'] = cookieToken;
    }

    return config;
};

publicApi.interceptors.request.use(
    async (config) => {
        return await addCsrfToken(config);
    },
    (error) => Promise.reject(error)
);

v1Api.interceptors.request.use(
    async (config) => {
        return await addCsrfToken(config);
    },
    (error) => Promise.reject(error)
);

/**
 * Remplace le message brut de Laravel (« CSRF token mismatch. »), incompréhensible
 * pour un visiteur, par une consigne utile. Ce message s'affiche tel quel sous
 * les champs des formulaires (voir errorFromServer dans SignupWizard).
 */
const withSessionMessage = (error: any) => {
    if (error?.response?.data) {
        error.response.data.message =
            'Votre session a expiré. Rechargez la page, puis réessayez. Si le problème persiste, autorisez les cookies pour ce site.';
    }
    return error;
};

const attachCsrfRetryInterceptor = (api: typeof publicApi) => {
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error?.config;
            const skipCsrf = Boolean(originalRequest?.skipCsrf) || isAuthBypassEndpoint(originalRequest?.url);
            if (skipCsrf) {
                return Promise.reject(error);
            }

            if (error?.response?.status === 419 && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;

                // Reprise forcee : l'ancien jeton est jeté avant d'en demander
                // un neuf, et on le repose explicitement sur la requête rejouée.
                const refreshed = await refreshCsrfToken(true);
                const token = refreshed ? getCookie('XSRF-TOKEN') : null;
                if (!token) {
                    return Promise.reject(withSessionMessage(error));
                }

                originalRequest.headers = { ...(originalRequest.headers || {}), 'X-XSRF-TOKEN': token };
                try {
                    return await api.request(originalRequest);
                } catch (retryError: any) {
                    // Le jeton était neuf et il est encore refusé : ce n'est
                    // plus un simple jeton périmé. Message lisible plutôt que
                    // le « CSRF token mismatch » brut de Laravel.
                    return Promise.reject(withSessionMessage(retryError));
                }
            }

            if (error?.response?.status === 419) {
                return Promise.reject(withSessionMessage(error));
            }

            return Promise.reject(error);
        }
    );
};

attachCsrfRetryInterceptor(publicApi);
attachCsrfRetryInterceptor(v1Api);

export function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        return meta.getAttribute('content') || '';
    }
    return '';
}

// ============================================
// ✅ CSRF TOKEN
// ============================================

/**
 * Efface les cookies CSRF présents dans le navigateur, sur toutes les
 * combinaisons de domaine et de chemin plausibles.
 *
 * Nécessaire avant de redemander un jeton : un cookie périmé (session expirée,
 * clé d'application changée, reliquat d'un ancien déploiement) n'est pas
 * remplacé par le nouveau s'il a été posé sur un autre domaine ou un autre
 * chemin — les deux coexistent et le serveur en reçoit un qu'il ne sait pas
 * déchiffrer.
 */
function clearCsrfCookies(): void {
    const host = window.location.hostname;
    const parts = host.split('.');
    const domains = ['', host, `.${host}`];
    if (parts.length > 2) {
        const parent = parts.slice(-2).join('.');
        domains.push(parent, `.${parent}`);
    }
    for (const path of ['/', '/api', '/sanctum']) {
        for (const domain of domains) {
            document.cookie =
                `XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}` +
                (domain ? `; domain=${domain}` : '');
        }
    }
}

/**
 * Demande un nouveau jeton CSRF au backend.
 *
 * `force` sert à la reprise après un 419 : on jette d'abord le jeton courant,
 * sans quoi on risque de renvoyer exactement celui que le serveur vient de
 * refuser, et de boucler sur la même erreur.
 */
export async function refreshCsrfToken(force = false): Promise<boolean> {
    if (force) {
        clearCsrfCookies();
    }

    try {
        const response = await fetch(CSRF_URL, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            console.warn('[CSRF] Réponse inattendue du serveur :', response.status);
        }

        // Ce qui compte n'est pas le code de réponse mais la présence effective
        // du cookie : un 204 sans cookie (cookies bloqués par le navigateur,
        // domaine non autorisé) doit être traité comme un échec.
        return Boolean(getCookie('XSRF-TOKEN'));
    } catch (error: any) {
        console.error('[CSRF] Impossible de récupérer le jeton :', error?.message || error);
        return false;
    }
}


// ============================================
// ✅ EXPORT PAR DÉFAUT
// ============================================

export default {
    publicApi,
    v1Api,
    getCookie,
    deleteCookie,
    deleteAllCookies,
    refreshCsrfToken,
};