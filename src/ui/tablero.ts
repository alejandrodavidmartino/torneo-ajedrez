import type { Resultado } from '../torneo/tipos';

/** 64 casillas de a8 a h1. Mayúsculas = blancas, minúsculas = negras, null = vacía. */
export type Posicion = (string | null)[];

export interface Paso {
  posicion: Posicion;
  desde: number;
  hasta: number;
}

const INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

export function desdeFen(fen: string): Posicion {
  const pos: Posicion = [];
  for (const c of fen) {
    if (c === '/') continue;
    if (/\d/.test(c)) pos.push(...Array<null>(Number(c)).fill(null));
    else pos.push(c);
  }
  return pos;
}

/** Índice de una casilla en notación algebraica: «e2» → 52. */
function casilla(nombre: string): number {
  return (8 - Number(nombre[1])) * 8 + (nombre.charCodeAt(0) - 97);
}

/** Apertura italiana tranquila, sin capturas ni enroques, para animar los tableros. */
const JUGADAS = 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d3 d7d6 b1d2 a7a6 h2h3 h7h6 a2a4 c8e6'.split(' ');

function construirPartida(): Paso[] {
  const pasos: Paso[] = [];
  let pos = desdeFen(INICIAL);
  for (const j of JUGADAS) {
    const desde = casilla(j.slice(0, 2));
    const hasta = casilla(j.slice(2, 4));
    pos = [...pos];
    pos[hasta] = pos[desde];
    pos[desde] = null;
    pasos.push({ posicion: pos, desde, hasta });
  }
  return pasos;
}

export const POSICION_INICIAL: Posicion = desdeFen(INICIAL);
export const PARTIDA: Paso[] = construirPartida();

const FINALES: Record<Resultado, { fen: string; etiqueta: string }> = {
  // Mate del pasillo: la torre blanca da mate al rey negro en g8.
  '1-0': { fen: '3R2k1/5ppp/8/8/8/8/5PPP/6K1', etiqueta: 'Ganan blancas' },
  // El mismo mate, con negras.
  '0-1': { fen: '6k1/5ppp/8/8/8/8/5PPP/3r2K1', etiqueta: 'Ganan negras' },
  '½-½': { fen: '8/8/4k3/8/8/4K3/8/8', etiqueta: 'Tablas' },
  '1F-0F': { fen: '8/8/8/8/8/8/PPPPPPPP/RNBQKBNR', etiqueta: 'Ganan blancas por incomparecencia' },
  '0F-1F': { fen: 'rnbqkbnr/pppppppp/8/8/8/8/8/8', etiqueta: 'Ganan negras por incomparecencia' },
};

export function posicionFinal(r: Resultado): { posicion: Posicion; etiqueta: string } {
  const { fen, etiqueta } = FINALES[r];
  return { posicion: desdeFen(fen), etiqueta };
}

/** Rey en jaque mate en la posición final, para resaltarlo. */
export function reyVencido(r: Resultado): number | null {
  if (r === '1-0') return casilla('g8');
  if (r === '0-1') return casilla('g1');
  return null;
}
