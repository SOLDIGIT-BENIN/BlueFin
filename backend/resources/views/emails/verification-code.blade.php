{{--
    Code de vérification envoyé à l'inscription.

    Mise en forme volontairement archaïque (tableaux, styles en ligne, aucune
    police distante) : c'est ce que comprennent les clients de messagerie.
    Couleurs de la charte : marine #0f2940, turquoise #00c9a7, blanc cassé #f4fffe.
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Votre code de vérification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4fffe;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4fffe; padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2f5f2;">

                    <tr>
                        <td align="center" style="background-color:#0f2940; padding:28px 24px;">
                            <img src="{{ rtrim(config('app.frontend_url', 'https://bluefin-immo.com'), '/') }}/icon-512.png"
                                 alt="Bluefin Immo" width="56" height="56"
                                 style="display:block; border:0; border-radius:12px;">
                            <p style="margin:12px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:18px; font-weight:bold; letter-spacing:1px; color:#ffffff;">
                                BLUEFIN <span style="color:#00c9a7;">IMMO</span>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 28px 8px; font-family:Arial,Helvetica,sans-serif; color:#0f2940;">
                            <h1 style="margin:0 0 12px; font-size:20px; line-height:1.3; color:#0f2940;">
                                Confirmez votre adresse e-mail
                            </h1>
                            <p style="margin:0; font-size:15px; line-height:1.6; color:#5b6b7a;">
                                Saisissez ce code dans la page d’inscription pour continuer la création de votre compte.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:20px 28px;">
                            <div style="display:inline-block; background-color:#f4fffe; border:1px solid #c9f0e8; border-radius:14px; padding:18px 28px;">
                                <span style="font-family:'Courier New',Courier,monospace; font-size:34px; font-weight:bold; letter-spacing:10px; color:#0f2940;">
                                    {{ $code }}
                                </span>
                            </div>
                            <p style="margin:14px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#5b6b7a;">
                                Ce code expire dans {{ $minutes }} minutes.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:8px 28px 28px; font-family:Arial,Helvetica,sans-serif;">
                            <p style="margin:0; font-size:13px; line-height:1.6; color:#5b6b7a;">
                                Vous n’êtes pas à l’origine de cette demande ? Ignorez ce message : aucun compte
                                ne sera créé sans ce code, et personne d’autre que vous ne le reçoit.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#f4fffe; padding:16px 28px; font-family:Arial,Helvetica,sans-serif; border-top:1px solid #e2f5f2;">
                            <p style="margin:0; font-size:12px; color:#5b6b7a;">
                                Bluefin Immo — location courte durée vérifiée au Bénin.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
