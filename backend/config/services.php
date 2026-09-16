<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Cloudinary — stockage des médias publics (App\Services\PhotoStorage).
     * Si ces valeurs sont absentes, les envois retombent sur le disque local :
     * pratique en développement, mais à ne pas laisser vide en production, les
     * fichiers ne survivant alors pas à un redéploiement.
     */
    'cloudinary' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
        'api_key' => env('CLOUDINARY_API_KEY'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
        'folder' => env('CLOUDINARY_FOLDER', 'bluefin'),
    ],

    /*
     * Connexion avec Google via Firebase Authentication (App\Services\GoogleIdToken).
     *
     * C'est le chemin utilisé aujourd'hui : le projet ne dispose pas d'un
     * Client ID OAuth « Application Web », mais d'un projet Firebase. Le jeton
     * rendu par le navigateur est alors un jeton d'identité Firebase, dont
     * l'audience est l'identifiant du projet — d'où la nécessité de le
     * connaître ici. Aucun secret : cet identifiant est public, il doit
     * simplement correspondre à VITE_FIREBASE_PROJECT_ID côté frontend.
     */
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
    ],

    /*
     * Connexion avec Google « classique » (Google Identity Services). Conservé
     * pour le jour où un vrai Client ID OAuth sera créé : GoogleIdToken accepte
     * les deux formes de jeton et choisit d'après l'émetteur. Seul le Client ID
     * est nécessaire, le jeton étant vérifié avec les clés publiques de Google.
     */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

];
