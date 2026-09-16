<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Vérification du jeton d'identité reçu du bouton « Se connecter avec Google ».
 *
 * Deux formes de jeton sont acceptées, car le frontend peut s'appuyer sur deux
 * mécanismes différents selon ce dont le projet dispose :
 *
 *  1. Jeton Firebase (chemin actuel) — le client nous a fourni la configuration
 *     Firebase de son projet, pas de Client ID OAuth. C'est Firebase
 *     Authentication qui porte l'écran Google, et le jeton est signé par
 *     securetoken@system, avec `aud` = identifiant du projet Firebase.
 *  2. Jeton Google Identity Services (chemin historique) — conservé pour le
 *     jour où un vrai Client ID OAuth sera créé : il suffira de renseigner
 *     GOOGLE_CLIENT_ID, rien d'autre à changer ici.
 *
 * Dans les deux cas la vérification est locale et complète : signature
 * (clés publiques de Google, mises en cache selon leur durée de validité
 * annoncée), émetteur, audience, expiration, e-mail vérifié. Aucun secret
 * client n'est nécessaire.
 */
class GoogleIdToken
{
    /** Clés publiques de Google Identity Services, au format JWKS. */
    private const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    /**
     * Clés publiques des jetons Firebase. Contrairement à l'URL ci-dessus, ce
     * point d'accès rend des certificats x509 au format PEM (et non un JWKS) :
     * il faut en extraire la clé publique nous-mêmes, JWK::parseKeySet ne sait
     * pas les lire.
     */
    private const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    private const FIREBASE_ISSUER_PREFIX = 'https://securetoken.google.com/';

    /**
     * @return array{sub: string, email: string, first_name: string, last_name: string, picture: ?string}
     * @throws RuntimeException jeton invalide, expiré, ou destiné à une autre application
     */
    public function verify(string $credential): array
    {
        $projectId = config('services.firebase.project_id');
        $clientId = config('services.google.client_id');

        if (blank($projectId) && blank($clientId)) {
            throw new RuntimeException(
                'La connexion Google n’est pas configurée : renseignez FIREBASE_PROJECT_ID '
                .'(connexion via Firebase Authentication) ou, à défaut, GOOGLE_CLIENT_ID.'
            );
        }

        JWT::$leeway = 60; // tolérance d'horloge entre nos serveurs et ceux de Google

        // On lit l'émetteur SANS vérifier la signature, uniquement pour savoir
        // quelle branche appliquer. Cette valeur n'est donc digne d'aucune
        // confiance à ce stade : chaque branche revérifie `iss` après avoir
        // validé la signature cryptographiquement.
        $issuer = $this->peekIssuer($credential);

        if (filled($projectId) && $issuer === self::FIREBASE_ISSUER_PREFIX.$projectId) {
            return $this->verifyFirebaseToken($credential, (string) $projectId);
        }

        if (filled($clientId) && in_array($issuer, self::GOOGLE_ISSUERS, true)) {
            return $this->verifyGoogleToken($credential, (string) $clientId);
        }

        throw new RuntimeException('Jeton Google : émetteur inattendu.');
    }

    /**
     * Jeton d'identité Firebase (signInWithPopup côté navigateur).
     */
    private function verifyFirebaseToken(string $credential, string $projectId): array
    {
        try {
            $claims = (array) JWT::decode($credential, $this->firebaseKeys());
        } catch (\Throwable $e) {
            throw new RuntimeException('Jeton Google invalide ou expiré.', 0, $e);
        }

        if (($claims['aud'] ?? null) !== $projectId) {
            throw new RuntimeException('Jeton Google destiné à une autre application.');
        }
        if (($claims['iss'] ?? null) !== self::FIREBASE_ISSUER_PREFIX.$projectId) {
            throw new RuntimeException('Jeton Google : émetteur inattendu.');
        }
        if (blank($claims['sub'] ?? null)) {
            throw new RuntimeException('Jeton Google : utilisateur non identifié.');
        }
        // Un jeton dont l'authentification est datée du futur est forcément forgé.
        if (isset($claims['auth_time']) && (int) $claims['auth_time'] > time() + JWT::$leeway) {
            throw new RuntimeException('Jeton Google : date d’authentification incohérente.');
        }

        $firebase = (array) ($claims['firebase'] ?? []);

        // Contrôle essentiel : le même projet Firebase peut aussi créer des
        // comptes par e-mail/mot de passe, par téléphone ou anonymes. Sans ce
        // test, un tel compte obtiendrait un jeton parfaitement valide et
        // passerait pour une connexion Google — avec, potentiellement, une
        // adresse e-mail choisie par son titulaire.
        if (($firebase['sign_in_provider'] ?? null) !== 'google.com') {
            throw new RuntimeException('Ce jeton ne provient pas d’une connexion Google.');
        }

        if (empty($claims['email']) || ! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            throw new RuntimeException('L’adresse e-mail de ce compte Google n’est pas vérifiée.');
        }

        [$firstName, $lastName] = $this->splitName($claims);

        return [
            // On préfère l'identifiant Google au `sub` Firebase : c'est lui qui
            // est déjà stocké dans users.google_id pour les comptes créés avant
            // le passage à Firebase. Utiliser le `sub` Firebase créerait un
            // doublon pour ces utilisateurs.
            'sub' => $this->googleIdentity($firebase) ?? (string) $claims['sub'],
            'email' => mb_strtolower((string) $claims['email']),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'picture' => $claims['picture'] ?? null,
        ];
    }

    /**
     * Jeton d'identité Google Identity Services (bouton Google « classique »).
     */
    private function verifyGoogleToken(string $credential, string $clientId): array
    {
        try {
            $claims = (array) JWT::decode($credential, JWK::parseKeySet($this->googleKeys()));
        } catch (\Throwable $e) {
            throw new RuntimeException('Jeton Google invalide ou expiré.', 0, $e);
        }

        if (! in_array($claims['iss'] ?? null, self::GOOGLE_ISSUERS, true)) {
            throw new RuntimeException('Jeton Google : émetteur inattendu.');
        }
        if (($claims['aud'] ?? null) !== $clientId) {
            throw new RuntimeException('Jeton Google destiné à une autre application.');
        }
        if (blank($claims['sub'] ?? null)) {
            throw new RuntimeException('Jeton Google : utilisateur non identifié.');
        }
        if (empty($claims['email']) || ! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            throw new RuntimeException('L’adresse e-mail de ce compte Google n’est pas vérifiée.');
        }

        [$firstName, $lastName] = $this->splitName($claims);

        return [
            'sub' => (string) $claims['sub'],
            'email' => mb_strtolower((string) $claims['email']),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'picture' => $claims['picture'] ?? null,
        ];
    }

    /**
     * Émetteur annoncé par le jeton, lu sans vérification — sert uniquement à
     * choisir la branche de vérification.
     */
    private function peekIssuer(string $credential): string
    {
        $parts = explode('.', $credential);
        if (count($parts) !== 3) {
            throw new RuntimeException('Jeton Google invalide ou expiré.');
        }

        try {
            $payload = json_decode(JWT::urlsafeB64Decode($parts[1]), true);
        } catch (\Throwable $e) {
            throw new RuntimeException('Jeton Google invalide ou expiré.', 0, $e);
        }

        return is_array($payload) ? (string) ($payload['iss'] ?? '') : '';
    }

    /**
     * Identifiant Google stable, tel que Firebase le recopie du fournisseur.
     */
    private function googleIdentity(array $firebase): ?string
    {
        $identities = (array) ($firebase['identities'] ?? []);
        $googleIds = (array) ($identities['google.com'] ?? []);
        $id = (string) ($googleIds[0] ?? '');

        return $id !== '' ? $id : null;
    }

    /**
     * Un jeton Firebase ne transporte que `name` : on le découpe faute de mieux
     * (premier mot = prénom, le reste = nom). De toute façon l'utilisateur peut
     * corriger ces deux champs à l'étape « Infos personnelles » de l'inscription.
     *
     * @return array{0: string, 1: string}
     */
    private function splitName(array $claims): array
    {
        $first = trim((string) ($claims['given_name'] ?? ''));
        $last = trim((string) ($claims['family_name'] ?? ''));
        if ($first !== '' || $last !== '') {
            return [$first, $last];
        }

        $name = trim((string) ($claims['name'] ?? ''));
        if ($name === '') {
            return ['', ''];
        }

        $parts = preg_split('/\s+/', $name, 2) ?: [$name];

        return [(string) $parts[0], trim((string) ($parts[1] ?? ''))];
    }

    /**
     * @return array<string, Key>
     */
    private function firebaseKeys(): array
    {
        $certificates = Cache::get('firebase_securetoken_certs');

        if (! $certificates) {
            $response = Http::timeout(10)->get(self::FIREBASE_CERTS_URL)->throw();
            $certificates = $response->json();

            // Google indique la durée de validité de ses clés dans Cache-Control.
            preg_match('/max-age=(\d+)/', (string) $response->header('Cache-Control'), $m);
            Cache::put('firebase_securetoken_certs', $certificates, (int) ($m[1] ?? 3600));
        }

        $keys = [];
        foreach ((array) $certificates as $kid => $pem) {
            $publicKey = openssl_pkey_get_public((string) $pem);
            if ($publicKey !== false) {
                $keys[(string) $kid] = new Key($publicKey, 'RS256');
            }
        }

        if ($keys === []) {
            throw new RuntimeException('Impossible de récupérer les clés de signature de Google.');
        }

        return $keys;
    }

    private function googleKeys(): array
    {
        $cached = Cache::get('google_oauth_certs');
        if ($cached) {
            return $cached;
        }

        $response = Http::timeout(10)->get(self::GOOGLE_CERTS_URL)->throw();
        $keys = $response->json();

        // Google indique la durée de validité de ses clés dans Cache-Control.
        preg_match('/max-age=(\d+)/', (string) $response->header('Cache-Control'), $m);
        Cache::put('google_oauth_certs', $keys, (int) ($m[1] ?? 3600));

        return $keys;
    }
}
