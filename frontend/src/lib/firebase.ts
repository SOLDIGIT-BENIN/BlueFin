// Initialisation de Firebase — Authentication uniquement.
//
// Pourquoi Firebase plutôt que Google Identity Services : le client ne dispose
// pas d'un Client ID OAuth « Application Web », il ne nous a fourni que la
// configuration Firebase de son projet. Firebase Authentication porte alors
// l'écran de consentement Google à notre place et nous rend un jeton
// d'identité Firebase, que le backend revérifie (App\Services\GoogleIdToken).
//
// Ces valeurs ne sont pas des secrets : Firebase les considère comme des
// identifiants publics, elles finissent de toute façon dans le bundle envoyé
// au navigateur (la sécurité repose sur les domaines autorisés et les règles
// du projet, pas sur leur confidentialité). Elles passent malgré tout par
// l'environnement, pour qu'un autre déploiement puisse viser un autre projet
// Firebase sans toucher au code.
//
// Volontairement PAS d'Analytics (`getAnalytics`) : la mesure d'audience est
// une collecte soumise au consentement préalable (loi n° 2017-20 portant Code
// du numérique au Bénin) et n'a rien à faire dans le parcours de connexion.
import type { Auth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

// storageBucket et messagingSenderId ne servent pas à l'authentification :
// les exiger empêcherait la connexion de fonctionner pour rien.
const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

/**
 * Faux tant que la configuration est incomplète. Les appelants s'en servent
 * pour masquer le bouton Google plutôt que de laisser le visiteur cliquer sur
 * quelque chose qui échouera.
 */
export const isFirebaseConfigured = REQUIRED.every((key) => Boolean(config[key]?.trim()));

let authPromise: Promise<Auth> | null = null;

/**
 * Charge le SDK et initialise l'application au premier besoin réel — c'est-à-dire
 * au clic sur « Continuer avec Google ». Deux raisons : un visiteur qui ne se
 * connecte jamais ne télécharge pas le SDK, et une configuration absente ou
 * cassée ne peut pas faire échouer le chargement de l'application entière.
 *
 * Renvoie null si la configuration est incomplète : au choix de l'appelant.
 */
export function getFirebaseAuth(): Promise<Auth> | null {
  if (!isFirebaseConfigured) return null;

  authPromise ??= (async () => {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');

    // getApps() : en développement, le rechargement à chaud peut réexécuter ce
    // module ; réinitialiser l'app par défaut lèverait une erreur.
    const app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    auth.useDeviceLanguage(); // écran de consentement Google en français ici

    return auth;
  })();

  return authPromise;
}
