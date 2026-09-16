import { ImageIcon } from 'lucide-react';

/**
 * Remplace l'image d'une annonce quand elle est absente ou illisible.
 *
 * Remplace l'ancien carré turquoise « BI » (ui-avatars) : sur une grille de
 * cartes sans photo, cet aplat de couleur de marque saturait tout l'écran et
 * faisait « placeholder cassé ». Ces tons neutres et désaturés se lisent comme
 * un choix de mise en page, pas comme une erreur.
 *
 * La teinte est tirée de l'identifiant de l'annonce : stable d'un rendu à
 * l'autre (pas de scintillement), mais variée d'une carte à l'autre.
 */
// Teintes désaturées dérivées du marine et du turquoise de la charte : assez
// sourdes pour ne pas être prises pour une erreur, assez proches de la marque
// pour qu'une grille sans photo reste « Bluefin » plutôt que grise.
const TONES = [
  '#bcd2d0', // menthe grisée
  '#9fb3c4', // marine éclairci
  '#a8c4c0', // turquoise sourd
  '#8ba3b2', // ardoise marine
  '#c6d9d6', // menthe pâle
  '#7f97a6', // marine moyen
];

function toneFor(seed: string | number): string {
  const s = String(seed);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return TONES[hash % TONES.length];
}

export function PhotoPlaceholder({
  seed,
  className = '',
  label,
}: {
  /** Identifiant de l'annonce — détermine la teinte */
  seed: string | number;
  className?: string;
  /** Texte discret optionnel (ex. « Photo à venir ») */
  label?: string;
}) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: toneFor(seed) }}
      role="img"
      aria-label={label || 'Photo indisponible'}
    >
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
          {label}
        </span>
      ) : (
        <ImageIcon className="w-7 h-7 text-white/40" strokeWidth={1.5} />
      )}
    </div>
  );
}
