# Design system Bluefin Immo

Règles de rendu de l'application, dérivées de la charte graphique officielle
(`docs/Bluefin Immo présentation logo.pdf`). Tout ce qui suit est appliqué dans
le code : si une règle vous gêne, changez la règle et le jeton, pas la valeur
dans un composant.

## 1. Couleurs — trois, pas quatre

| Rôle | Valeur | Jeton CSS | Usage |
|---|---|---|---|
| Bleu nuit | `#0f2940` | `--bluefin-navy` | Structure : texte, fonds pleins, bandeaux, pied de page |
| Turquoise | `#00c9a7` | `--bluefin-teal` | Accent : action principale, état actif, prix |
| Blanc cassé | `#f4fffe` | `--bluefin-mint` | Fond, respiration |

Les variations (`--bluefin-teal-hover`, `--bluefin-navy-soft`,
`--bluefin-teal-surface`, `--bluefin-border`, `--bluefin-text-muted`…) sont des
dérivés de ces trois couleurs, définis dans `src/styles/theme.css`. **Aucune
autre teinte n'est admise** — pas de gris neutre (`gray-500`), pas de bleu
Tailwind, pas de violet.

Trois exceptions, et seulement celles-là :
- **Citron `#ffc93c`** : uniquement le badge « Certifié » (`CertifiedBadge`).
  C'est l'argument de confiance du site ; il doit rester distinct du turquoise,
  qui signale les actions.
- **Rouge `#d4183d` / vert `#16a34a`** : erreur et succès. La charte ne peut pas
  exprimer un état, ces deux couleurs ne servent qu'à ça.
- **Couleurs de marques tierces** : bouton Google (règles de marque Google),
  bouton WhatsApp. Ne jamais les recolorer.

Le turquoise est un accent : pas de grande surface turquoise. Un bandeau pleine
largeur est marine ; le turquoise s'y pose en bouton, en surtitre, en pastille.

## 2. Typographie

- **Titres** : `--font-display` = Nexa → Montserrat → Plus Jakarta Sans.
  Graisse 700 (800 pour h1/h2), interlettrage resserré. La charte décrit la
  typo de marque comme géométrique et capitale ; Nexa est commerciale, donc
  non distribuée ici — déposez les fichiers dans `public/fonts` + `@font-face`
  et toute l'application bascule dessus sans autre modification.
- **Texte** : Plus Jakarta Sans (`--font-primary`).
- **Surtitre** : classe `.eyebrow` (capitales, interlettrage large, 11 px).
  C'est la seule façon d'employer les capitales hors logo.
- Pas de serif. Un titre en serif contredit le dessin du logo.

## 3. Logo

Toujours via les composants de `src/app/components/brand/BluefinLogo.tsx` —
jamais une image matricielle, jamais le mot « Bluefin Immo » écrit à la main à
côté d'un pictogramme.

```tsx
<BluefinLogo orientation="horizontal" />              // barre de navigation
<BluefinLogo orientation="stacked" />                 // accueil, écrans d'auth
<BluefinLogo orientation="horizontal" tone="onDark" /> // fond marine
<BluefinMark className="h-6 w-auto" />                // pictogramme seul
```

Sur fond marine, `tone="onDark"` : les parties marine passent en blanc, le
turquoise est conservé — c'est la déclinaison de la charte (panneau, véhicule,
vitrine). Le nom de la marque s'écrit **Bluefin Immo**, sans trait d'union.

## 4. Formes

- Cartes : `rounded-2xl`, bordure `--bluefin-border`, ombre discrète.
- Boutons d'action principale : pilule (`rounded-full`), aplat turquoise,
  survol `--bluefin-teal-hover`.
- Champs : `rounded-xl`, bordure `--bluefin-border`, anneau de focus turquoise.

## 5. Interdits

- **Aucun dégradé de marque** (turquoise → marine). La charte procède par
  aplats francs. Seule exception : le voile sombre posé sur une photo pour
  rendre un texte lisible.
- Pas de texte en dégradé découpé (`bg-clip-text`).
- Pas d'emoji en guise d'icône — SVG uniquement (lucide-react).
- Pas de couleur écrite en dur si un jeton existe.
- Pas de nouvelle famille de couleur Tailwind (`blue-600`, `purple-500`,
  `gray-400`…) : elles ont toutes été retirées du code, ne les réintroduisez pas.

## 6. Code

- Les nouvelles pages vivent dans `src/app/pages/`, pas dans le monolithe
  `src/app/pages.tsx` (28 000 lignes, en cours de démantèlement).
- Un composant partagé plutôt qu'un cinquième badge « Certifié » recopié.
