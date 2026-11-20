import { useEffect, useState } from 'preact/hooks';
import type { Resultado } from '../torneo/tipos';
import { PARTIDA, POSICION_INICIAL, posicionFinal, reyVencido } from './tablero';

// Piezas en su versión maciza; el color lo pone el CSS. U+FE0E evita que el móvil las pinte como emoji.
const GLIFO: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const TEXTO = '︎';

function prefiereSinMovimiento(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Minitablero decorativo de una mesa. Mientras no hay resultado, se mueve una
 * pieza cada pocos segundos; con resultado, muestra una posición final acorde.
 */
export function MiniTablero({ resultado, semilla }: { resultado: Resultado | null; semilla: number }) {
  // -1 = posición inicial; cada mesa empieza en un punto distinto de la partida.
  const [paso, setPaso] = useState(() => (semilla * 5) % PARTIDA.length);

  useEffect(() => {
    if (resultado || prefiereSinMovimiento()) return;
    const intervalo = 2500 + ((semilla * 977) % 2500);
    const id = setInterval(() => setPaso((p) => (p + 1 >= PARTIDA.length ? -1 : p + 1)), intervalo);
    return () => clearInterval(id);
  }, [resultado, semilla]);

  let posicion = paso < 0 ? POSICION_INICIAL : PARTIDA[paso].posicion;
  let marcadas: number[] = paso < 0 ? [] : [PARTIDA[paso].desde, PARTIDA[paso].hasta];
  let etiqueta = 'Partida en juego';
  let vencido: number | null = null;
  if (resultado) {
    const final = posicionFinal(resultado);
    posicion = final.posicion;
    etiqueta = final.etiqueta;
    marcadas = [];
    vencido = reyVencido(resultado);
  }

  return (
    <div class={`mini-tablero solo-pantalla${resultado ? ' con-resultado' : ''}`} role="img" aria-label={etiqueta}>
      {posicion.map((pieza, i) => {
        const oscura = (Math.floor(i / 8) + (i % 8)) % 2 === 1;
        const clases = ['casilla', oscura ? 'oscura' : 'clara', marcadas.includes(i) && 'movida', i === vencido && 'vencido']
          .filter(Boolean)
          .join(' ');
        return (
          <span key={i} class={clases}>
            {pieza && (
              <span class={pieza === pieza.toUpperCase() ? 'ficha ficha-b' : 'ficha ficha-n'}>
                {GLIFO[pieza.toLowerCase()] + TEXTO}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
