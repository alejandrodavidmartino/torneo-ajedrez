import type { Color, Jugador, Resultado, Torneo } from './tipos';

export interface Estadistica {
  id: string;
  puntos: number;
  buchholz: number;
  sonneborn: number;
  blancas: number;
  negras: number;
  /** Colores de las partidas jugadas, en orden. */
  colores: Color[];
  rivales: Set<string>;
  descansos: number;
}

export interface FilaClasificacion {
  jugador: Jugador;
  est: Estadistica;
  puesto: number;
}

/** Puntos de blancas y negras para un resultado, y si la partida se jugó de verdad. */
export function puntuar(r: Resultado): { blancas: number; negras: number; jugada: boolean } {
  switch (r) {
    case '1-0': return { blancas: 1, negras: 0, jugada: true };
    case '½-½': return { blancas: 0.5, negras: 0.5, jugada: true };
    case '0-1': return { blancas: 0, negras: 1, jugada: true };
    case '1F-0F': return { blancas: 1, negras: 0, jugada: false };
    case '0F-1F': return { blancas: 0, negras: 1, jugada: false };
  }
}

/**
 * Calcula puntos, colores, rivales y desempates a partir de las rondas.
 * Solo cuentan las mesas con resultado. Las rondas no jugadas (descanso o
 * incomparecencia) aportan 0 a Buchholz y Sonneborn-Berger.
 */
export function estadisticas(t: Torneo, hastaRonda?: number): Map<string, Estadistica> {
  const est = new Map<string, Estadistica>();
  for (const j of t.jugadores) {
    est.set(j.id, { id: j.id, puntos: 0, buchholz: 0, sonneborn: 0, blancas: 0, negras: 0, colores: [], rivales: new Set(), descansos: 0 });
  }
  // Partidas jugadas: [jugador, rival, puntos obtenidos por el jugador]
  const jugadas: [string, string, number][] = [];

  for (const ronda of t.rondas) {
    if (hastaRonda !== undefined && ronda.numero > hastaRonda) continue;
    if (ronda.descansa) {
      const e = est.get(ronda.descansa)!;
      e.puntos += 1;
      e.descansos += 1;
    }
    for (const m of ronda.mesas) {
      if (!m.resultado) continue;
      const p = puntuar(m.resultado);
      const b = est.get(m.blancas)!;
      const n = est.get(m.negras)!;
      b.puntos += p.blancas;
      n.puntos += p.negras;
      if (p.jugada) {
        b.blancas += 1; b.colores.push('B'); b.rivales.add(m.negras);
        n.negras += 1; n.colores.push('N'); n.rivales.add(m.blancas);
        jugadas.push([m.blancas, m.negras, p.blancas], [m.negras, m.blancas, p.negras]);
      }
    }
  }

  for (const [yo, rival, obtenido] of jugadas) {
    const e = est.get(yo)!;
    const puntosRival = est.get(rival)!.puntos;
    e.buchholz += puntosRival;
    e.sonneborn += puntosRival * obtenido;
  }
  return est;
}

/** Compara dos jugadores para ordenarlos: puntos, Buchholz, S-B, ELO (sin ELO al final), inscripción. */
export function compararClasificacion(a: Jugador, ea: Estadistica, b: Jugador, eb: Estadistica): number {
  return (
    eb.puntos - ea.puntos ||
    eb.buchholz - ea.buchholz ||
    eb.sonneborn - ea.sonneborn ||
    (b.elo ?? -1) - (a.elo ?? -1) ||
    a.orden - b.orden
  );
}

export function clasificacion(t: Torneo): FilaClasificacion[] {
  const est = estadisticas(t);
  return [...t.jugadores]
    .sort((a, b) => compararClasificacion(a, est.get(a.id)!, b, est.get(b.id)!))
    .map((jugador, i) => ({ jugador, est: est.get(jugador.id)!, puesto: i + 1 }));
}
