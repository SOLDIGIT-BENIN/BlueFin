/**
 * Logo Bluefin Immo — composants d'affichage.
 *
 * Remplace l'ancien logo JPEG (1182×1182 avec 40 % de blanc autour, affiché
 * en 40 px : la clé et la maison devenaient illisibles, et le fond blanc
 * ressortait en carré sur les surfaces marine). Ici, tracés vectoriels nets à
 * toute taille, fond transparent, et recoloration pour les fonds foncés.
 *
 * Deux dispositions, toutes deux issues de la charte :
 *  - `stacked`     : pictogramme au-dessus de la signature (verrouillage
 *                    principal de la charte — écrans d'accueil, pied de page,
 *                    écrans d'authentification) ;
 *  - `horizontal`  : pictogramme à gauche de la signature (barre de navigation,
 *                    où la hauteur disponible ne dépasse pas 40 px).
 *
 * Deux tons :
 *  - `brand`  : marine + turquoise, sur fond clair ;
 *  - `onDark` : les parties marine passent en blanc, le turquoise est conservé
 *               (c'est ainsi que la charte décline le logo sur fond marine —
 *               voir les mises en situation panneau / véhicule / vitrine).
 */
import {
  MARK_NAVY,
  MARK_TEAL,
  MARK_VIEWBOX,
  WORDMARK_NAVY,
  WORDMARK_TEAL,
  WORDMARK_VIEWBOX,
} from './logoPaths';

type Tone = 'brand' | 'onDark' | 'mono';

const NAVY = '#0f2940';
const TEAL = '#00c9a7';

function colors(tone: Tone) {
  if (tone === 'onDark') return { navy: '#ffffff', teal: TEAL };
  if (tone === 'mono') return { navy: 'currentColor', teal: 'currentColor' };
  return { navy: NAVY, teal: TEAL };
}

/** Pictogramme seul : clé + maison. Ratio ≈ 2,54:1. */
export function BluefinMark({
  className = 'h-8 w-auto',
  tone = 'brand',
  title,
}: {
  className?: string;
  tone?: Tone;
  title?: string;
}) {
  const c = colors(tone);
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} role={title ? 'img' : 'presentation'} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path fill={c.navy} fillRule="evenodd" d={MARK_NAVY} />
      <path fill={c.teal} fillRule="evenodd" d={MARK_TEAL} />
    </svg>
  );
}

/** Signature typographique seule : BLUEFIN IMMO. Ratio ≈ 10,5:1. */
export function BluefinWordmark({
  className = 'h-4 w-auto',
  tone = 'brand',
}: {
  className?: string;
  tone?: Tone;
}) {
  const c = colors(tone);
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={className} aria-hidden="true">
      <path fill={c.navy} fillRule="evenodd" d={WORDMARK_NAVY} />
      <path fill={c.teal} fillRule="evenodd" d={WORDMARK_TEAL} />
    </svg>
  );
}

/**
 * Verrouillage complet (pictogramme + signature).
 *
 * La hauteur se pilote par `className` sur l'élément englobant ; les deux
 * parties gardent leurs proportions relatives de la charte.
 */
export function BluefinLogo({
  orientation = 'horizontal',
  tone = 'brand',
  className,
  markClassName,
  wordmarkClassName,
}: {
  orientation?: 'horizontal' | 'stacked';
  tone?: Tone;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  if (orientation === 'stacked') {
    return (
      <span className={`inline-flex flex-col items-center ${className ?? ''}`}>
        <BluefinMark className={markClassName ?? 'h-10 w-auto'} tone={tone} title="Bluefin Immo" />
        <BluefinWordmark className={`mt-1.5 ${wordmarkClassName ?? 'h-[0.9rem] w-auto'}`} tone={tone} />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <BluefinMark className={markClassName ?? 'h-7 w-auto'} tone={tone} title="Bluefin Immo" />
      <BluefinWordmark className={wordmarkClassName ?? 'h-[0.8rem] w-auto'} tone={tone} />
    </span>
  );
}

/**
 * Pictogramme dans une tuile carrée — pour les contextes où il faut un bloc
 * carré (avatar, favicon, vignette de conversation).
 */
export function BluefinTile({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-[#0f2940] ${className}`}>
      <BluefinMark className="w-[72%] h-auto" tone="onDark" title="Bluefin Immo" />
    </span>
  );
}
