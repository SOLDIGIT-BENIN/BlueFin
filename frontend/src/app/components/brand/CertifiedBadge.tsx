/**
 * Badge « Certifié Bluefin Immo ».
 *
 * Il existait jusqu'ici en cinq versions différentes selon l'écran (citron,
 * turquoise, marine, et même un bleu Tailwind étranger à la charte) : le même
 * gage de confiance ne se reconnaissait pas d'une page à l'autre. Une seule
 * définition ici, utilisée partout.
 *
 * Le citron est la seule couleur hors charte conservée dans l'application, et
 * uniquement pour ce badge : c'est l'argument de confiance du site, il doit
 * rester distinct du turquoise, qui signale les actions.
 */
import { BadgeCheck } from 'lucide-react';

export function CertifiedBadge({
  size = 'sm',
  className = '',
  label = 'Certifié',
}: {
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}) {
  const dims =
    size === 'md'
      ? 'text-[11px] px-3 py-1 gap-1.5'
      : 'text-[10px] px-2.5 py-1 gap-1';
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[var(--bluefin-citron)] text-[var(--bluefin-citron-ink)] font-extrabold ${dims} ${className}`}
    >
      <BadgeCheck className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {label}
    </span>
  );
}
