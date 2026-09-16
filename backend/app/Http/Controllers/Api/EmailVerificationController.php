<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EmailVerificationCode;
use Illuminate\Http\Request;

/**
 * Vérification de l'adresse e-mail à l'inscription (code à six chiffres).
 *
 * Étape intermédiaire du parcours d'inscription par e-mail : le visiteur ne
 * peut pas passer aux informations personnelles tant qu'il n'a pas prouvé
 * qu'il reçoit bien le courrier envoyé à l'adresse saisie. Le parcours Google
 * ne passe pas par ici : l'adresse est déjà vérifiée par Google.
 */
class EmailVerificationController extends Controller
{
    public function __construct(private EmailVerificationCode $codes) {}

    public function send(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
        ], $this->frenchValidationMessages());

        // Une adresse déjà inscrite ne doit pas recevoir de code : le visiteur
        // doit se connecter, pas créer un second compte. Le formulaire vérifie
        // déjà la disponibilité avant d'arriver ici ; ce contrôle empêche de
        // contourner l'écran.
        if (User::where('email', mb_strtolower(trim($data['email'])))->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Un compte existe déjà avec cette adresse. Connectez-vous.',
                'email_taken' => true,
            ], 409);
        }

        $wait = $this->codes->secondsBeforeResend($data['email']);
        if ($wait > 0) {
            return response()->json([
                'success' => false,
                'message' => "Un code vient d’être envoyé. Patientez {$wait} secondes avant d’en demander un autre.",
                'resend_in' => $wait,
            ], 429);
        }

        try {
            $result = $this->codes->send($data['email']);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Code envoyé. Vérifiez votre boîte de réception.',
            ...$result,
        ]);
    }

    public function verify(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'code' => 'required|digits:6',
        ], $this->frenchValidationMessages());

        $result = $this->codes->verify($data['email'], $data['code']);

        if ($result !== true) {
            return response()->json(['success' => false, 'message' => $result], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Adresse vérifiée.',
            // Le visiteur a ce délai pour terminer son inscription ; au-delà,
            // la preuve expire et il faudra redemander un code.
            'valid_for_minutes' => $this->codes->verifiedWindowMinutes(),
        ]);
    }
}
