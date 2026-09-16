<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Code à six chiffres envoyé par e-mail à l'inscription.
 *
 * Sert à prouver que le visiteur possède bien l'adresse qu'il saisit : sans
 * cela, n'importe qui peut créer un compte avec l'adresse d'un tiers, et
 * l'adresse à laquelle partent les confirmations de réservation n'est jamais
 * vérifiée. Le parcours Google n'en a pas besoin : Google a déjà vérifié
 * l'adresse, et son jeton le prouve (claim `email_verified`).
 *
 * Tout est en cache, rien en base : ces codes vivent quelques minutes et il
 * serait absurde de leur consacrer une table. Attention en revanche, cela
 * suppose un cache partagé entre les processus web (file/database/redis, pas
 * `array`).
 */
class EmailVerificationCode
{
    /** Validité du code envoyé. */
    private const TTL = 600;

    /** Délai minimal entre deux envois, pour ne pas servir de robot à spam. */
    private const RESEND_DELAY = 60;

    /** Essais autorisés avant invalidation du code. */
    private const MAX_ATTEMPTS = 5;

    /** Durée pendant laquelle une adresse vérifiée peut servir à créer le compte. */
    private const VERIFIED_TTL = 3600;

    /**
     * @return array{expires_in:int, resend_in:int}
     * @throws \RuntimeException si l'e-mail ne part pas
     */
    public function send(string $email): array
    {
        $email = $this->normalize($email);

        $code = (string) random_int(100000, 999999);

        Cache::put($this->codeKey($email), [
            'hash' => $this->hash($code),
            'attempts' => 0,
            'sent_at' => time(),
        ], self::TTL);

        try {
            Mail::send('emails.verification-code', [
                'code' => $code,
                'minutes' => (int) (self::TTL / 60),
            ], function ($message) use ($email, $code) {
                $message->to($email)->subject("Votre code de vérification Bluefin Immo : {$code}");
            });
        } catch (\Throwable $e) {
            // Le code est retiré : le laisser en cache bloquerait le renvoi
            // pendant dix minutes alors que le visiteur n'a rien reçu.
            Cache::forget($this->codeKey($email));
            // La cause exacte (SMTP injoignable, vue introuvable…) ne doit pas
            // être renvoyée au navigateur, mais sans trace dans le journal elle
            // serait introuvable en production.
            Log::error('Envoi du code de vérification impossible', [
                'error' => $e->getMessage(),
                'mailer' => config('mail.default'),
            ]);
            throw new \RuntimeException("L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.", 0, $e);
        }

        return ['expires_in' => self::TTL, 'resend_in' => self::RESEND_DELAY];
    }

    /** Secondes restantes avant de pouvoir renvoyer un code (0 si c'est possible tout de suite). */
    public function secondsBeforeResend(string $email): int
    {
        $entry = Cache::get($this->codeKey($this->normalize($email)));
        if (! is_array($entry) || empty($entry['sent_at'])) {
            return 0;
        }

        return max(0, self::RESEND_DELAY - (time() - (int) $entry['sent_at']));
    }

    /**
     * Vérifie le code saisi.
     *
     * @return true|string  true si le code est bon, sinon le message à afficher
     */
    public function verify(string $email, string $code): true|string
    {
        $email = $this->normalize($email);
        $entry = Cache::get($this->codeKey($email));

        if (! is_array($entry)) {
            return 'Ce code a expiré. Demandez-en un nouveau.';
        }

        $attempts = (int) ($entry['attempts'] ?? 0) + 1;
        if ($attempts > self::MAX_ATTEMPTS) {
            Cache::forget($this->codeKey($email));
            return 'Trop de tentatives. Demandez un nouveau code.';
        }

        if (! hash_equals((string) $entry['hash'], $this->hash($code))) {
            $entry['attempts'] = $attempts;
            // On conserve la durée de vie restante plutôt que de la remettre à
            // zéro : sinon, se tromper prolongerait la validité du code.
            Cache::put($this->codeKey($email), $entry, $this->remainingTtl($entry));
            $left = self::MAX_ATTEMPTS - $attempts;

            return $left > 0
                ? "Code incorrect. Il vous reste {$left} " . ($left > 1 ? 'tentatives.' : 'tentative.')
                : 'Trop de tentatives. Demandez un nouveau code.';
        }

        Cache::forget($this->codeKey($email));
        Cache::put($this->verifiedKey($email), true, self::VERIFIED_TTL);

        return true;
    }

    /** L'adresse a-t-elle été vérifiée récemment ? */
    public function isVerified(string $email): bool
    {
        return (bool) Cache::get($this->verifiedKey($this->normalize($email)));
    }

    /** À appeler une fois le compte créé : la preuve ne doit pas resservir. */
    public function consume(string $email): void
    {
        Cache::forget($this->verifiedKey($this->normalize($email)));
    }

    public function verifiedWindowMinutes(): int
    {
        return (int) (self::VERIFIED_TTL / 60);
    }

    private function normalize(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    /** Le code n'est jamais stocké en clair, même pour dix minutes. */
    private function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }

    /** L'adresse n'apparaît pas en clair dans la clé de cache. */
    private function codeKey(string $email): string
    {
        return 'email-code:' . hash('sha256', $email);
    }

    private function verifiedKey(string $email): string
    {
        return 'email-verified:' . hash('sha256', $email);
    }

    private function remainingTtl(array $entry): int
    {
        return max(30, self::TTL - (time() - (int) ($entry['sent_at'] ?? time())));
    }
}
