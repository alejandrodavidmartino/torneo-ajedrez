/** Peón dibujado a mano: blanco con contorno negro, o negro macizo. */
export function Peon({ color }: { color: 'blanco' | 'negro' }) {
  return (
    <svg class={`peon peon-${color}`} viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <circle cx="12" cy="6" r="3.5" />
      <path d="M9.2 10.5h5.6l-.9 1.6c1.9 1.6 2.9 4 3.1 6.4H7c.2-2.4 1.2-4.8 3.1-6.4z" />
      <rect x="5" y="19" width="14" height="3" rx="1" />
    </svg>
  );
}
