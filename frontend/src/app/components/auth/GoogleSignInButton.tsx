// Bouton « Continuer avec Google », adossé à Firebase Authentication.
//
// Le client ne nous a pas fourni de Client ID OAuth, seulement la configuration
// Firebase de son projet : on ouvre donc la fenêtre de consentement Google via
// `signInWithPopup` plutôt que via Google Identity Services. Le jeton transmis
// à `onCredential` est un jeton d'identité *Firebase*, que le backend sait
// vérifier (backend/app/Services/GoogleIdToken.php).
//
// Conséquence : Google ne dessine plus le bouton pour nous, on le dessine
// nous-mêmes. Les règles de marque Google imposent le logo officiel, un fond
// blanc, une bordure grise et le texte en #1f1f1f — d'où l'absence totale de
// couleur Bluefin ici, c'est volontaire.
import { useState } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from '../../../lib/firebase';

/** Logo Google officiel — les quatre couleurs de marque, à ne pas modifier. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

const LABELS: Record<string, string> = {
  continue_with: 'Continuer avec Google',
  signin_with: 'Se connecter avec Google',
  signup_with: 'Continuer avec Google',
};

/**
 * Traduit les codes d'erreur Firebase en message affichable.
 * Renvoie une chaîne vide quand il n'y a rien à dire au visiteur : fermer la
 * popup est une action délibérée, pas une panne.
 */
function messageFor(code: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return '';
    case 'auth/popup-blocked':
      return 'Votre navigateur a bloqué la fenêtre Google. Autorisez les fenêtres surgissantes pour ce site, puis réessayez.';
    case 'auth/unauthorized-domain':
      return "Ce domaine n'est pas autorisé pour la connexion Google. Ajoutez-le dans la console Firebase : Authentication > Settings > Authorized domains.";
    case 'auth/operation-not-allowed':
      return "La connexion Google n'est pas activée sur le projet Firebase. Activez le fournisseur Google dans la console : Authentication > Sign-in method.";
    case 'auth/network-request-failed':
      return 'Connexion au service Google impossible. Vérifiez votre connexion internet et réessayez.';
    case 'auth/account-exists-with-different-credential':
      return 'Un compte existe déjà avec cette adresse e-mail via une autre méthode de connexion.';
    default:
      return 'La connexion avec Google a échoué. Réessayez dans un instant.';
  }
}

export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
  disabled = false,
}: {
  onCredential: (credential: string) => void;
  /** Libellé officiel Google : « Continuer avec Google » ou « Se connecter avec Google ». */
  text?: 'continue_with' | 'signin_with' | 'signup_with';
  disabled?: boolean;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || disabled) return;
    setError('');
    setBusy(true);

    try {
      const auth = await getFirebaseAuth();
      if (!auth) throw new Error('unconfigured');

      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      // Sans cela, Google reconnecte silencieusement le dernier compte utilisé :
      // impossible pour un visiteur d'en changer sur un poste partagé.
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = await result.user.getIdToken();
      onCredential(credential);
    } catch (e: unknown) {
      const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
      setError(messageFor(code));
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured) {
    // En production, sans configuration, on masque simplement le bouton plutôt
    // que d'offrir au visiteur un chemin qui ne peut pas aboutir.
    return import.meta.env.DEV ? (
      <p className="text-xs text-center text-[#6b4e06] bg-[#fffaeb] rounded-xl py-2 px-3">
        Connexion Google non configurée : renseignez les variables VITE_FIREBASE_* .
      </p>
    ) : null;
  }

  const isDisabled = disabled || busy;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={busy}
        className="w-full min-h-[44px] flex items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-5 py-2.5 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f7f8f8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#747775] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <span
            className="w-[18px] h-[18px] rounded-full border-2 border-[#747775] border-t-transparent animate-spin"
            aria-hidden="true"
          />
        ) : (
          <GoogleLogo />
        )}
        <span>{busy ? 'Connexion en cours…' : LABELS[text]}</span>
      </button>
      {error && (
        <p className="text-xs text-center text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const isGoogleSignInConfigured = isFirebaseConfigured;
