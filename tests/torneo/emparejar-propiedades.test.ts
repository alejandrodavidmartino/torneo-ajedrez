import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { estadisticas } from '../../src/torneo/calculos';
import type { Torneo } from '../../src/torneo/tipos';
import { simular } from './ayudas';

function sinRivalesRepetidos(t: Torneo): boolean {
  const vistos = new Set<string>();
  for (const r of t.rondas) {
    for (const m of r.mesas) {
      const clave = [m.blancas, m.negras].sort().join('|');
      if (vistos.has(clave)) return false;
      vistos.add(clave);
    }
  }
  return true;
}

function todosUnaVezPorRonda(t: Torneo): boolean {
  return t.rondas.every((r) => {
    const ids = [...r.mesas.flatMap((m) => [m.blancas, m.negras]), ...(r.descansa ? [r.descansa] : [])];
    return ids.length === t.jugadores.length && new Set(ids).size === t.jugadores.length;
  });
}

function descansosUnicos(t: Torneo): boolean {
  const d = t.rondas.map((r) => r.descansa).filter((x) => x !== null);
  return new Set(d).size === d.length;
}

function coloresEquilibrados(t: Torneo): boolean {
  for (const e of estadisticas(t).values()) {
    if (Math.abs(e.blancas - e.negras) > 1) return false;
    for (let i = 2; i < e.colores.length; i++) {
      if (e.colores[i] === e.colores[i - 1] && e.colores[i] === e.colores[i - 2]) return false;
    }
  }
  return true;
}

const caso = fc
  .integer({ min: 4, max: 24 })
  .chain((n) => fc.tuple(fc.constant(n), fc.integer({ min: 1, max: Math.min(n - 1, 9) }), fc.integer({ min: 0, max: 2 ** 31 - 1 })));

describe('propiedades del emparejamiento suizo', () => {
  test('nunca repite rival, todos juegan o descansan una vez por ronda y nadie descansa dos veces', () => {
    fc.assert(
      fc.property(caso, ([n, rondas, semilla]) => {
        const t = simular(n, rondas, semilla);
        expect(sinRivalesRepetidos(t)).toBe(true);
        expect(todosUnaVezPorRonda(t)).toBe(true);
        expect(descansosUnicos(t)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  test('con pocas rondas casi siempre se completa el torneo con colores equilibrados', () => {
    let ok = 0;
    const total = 200;
    for (let i = 0; i < total; i++) {
      const n = 4 + (i % 21);
      const rondas = Math.min(n - 1, Math.ceil(Math.log2(n)) + 1);
      const t = simular(n, rondas, 1000 + i);
      if (t.rondas.length === rondas && coloresEquilibrados(t)) ok++;
    }
    expect(ok / total).toBeGreaterThanOrEqual(0.95);
  });

  test('40 jugadores y 9 rondas en menos de 2 segundos', () => {
    const inicio = performance.now();
    const t = simular(40, 9, 7);
    expect(t.rondas).toHaveLength(9);
    expect(performance.now() - inicio).toBeLessThan(2000);
  });
});
