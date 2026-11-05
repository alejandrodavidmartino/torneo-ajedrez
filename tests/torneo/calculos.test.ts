import { describe, expect, test } from 'vitest';
import { clasificacion, estadisticas } from '../../src/torneo/calculos';
import type { Jugador, Ronda, Torneo } from '../../src/torneo/tipos';

function jugador(id: string, orden: number, elo: number | null = null): Jugador {
  return { id, nombre: id, elo, orden, retirado: false };
}

function torneo(jugadores: Jugador[], rondas: Ronda[]): Torneo {
  return { version: 1, nombre: 'Prueba', rondasTotales: 3, semilla: 1, estado: 'en-curso', jugadores, rondas };
}

// R1: A–B 1-0, C–D ½-½ · R2: A–C ½-½, D–B 0F-1F (D no se presentó)
const base = torneo(
  [jugador('A', 1), jugador('B', 2), jugador('C', 3), jugador('D', 4)],
  [
    {
      numero: 1, cerrada: true, descansa: null,
      mesas: [
        { numero: 1, blancas: 'A', negras: 'B', resultado: '1-0' },
        { numero: 2, blancas: 'C', negras: 'D', resultado: '½-½' },
      ],
    },
    {
      numero: 2, cerrada: false, descansa: null,
      mesas: [
        { numero: 1, blancas: 'A', negras: 'C', resultado: '½-½' },
        { numero: 2, blancas: 'D', negras: 'B', resultado: '0F-1F' },
      ],
    },
  ],
);

describe('estadisticas', () => {
  const est = estadisticas(base);

  test('suma puntos de victorias, tablas e incomparecencias', () => {
    expect(est.get('A')!.puntos).toBe(1.5);
    expect(est.get('B')!.puntos).toBe(1);
    expect(est.get('C')!.puntos).toBe(1);
    expect(est.get('D')!.puntos).toBe(0.5);
  });

  test('Buchholz suma los puntos actuales de los rivales jugados', () => {
    expect(est.get('A')!.buchholz).toBe(2);
    expect(est.get('C')!.buchholz).toBe(2);
    expect(est.get('B')!.buchholz).toBe(1.5);
  });

  test('Sonneborn-Berger pondera por el resultado', () => {
    expect(est.get('A')!.sonneborn).toBe(1.5);
  });

  test('la incomparecencia no cuenta como color ni como rival', () => {
    const b = est.get('B')!;
    expect(b.blancas + b.negras).toBe(1);
    expect(b.colores).toEqual(['N']);
    expect([...b.rivales]).toEqual(['A']);
  });

  test('los resultados pendientes no cuentan', () => {
    const pendiente = structuredClone(base);
    pendiente.rondas[1].mesas[0].resultado = null;
    const e = estadisticas(pendiente);
    expect(e.get('A')!.puntos).toBe(1);
    expect(e.get('A')!.colores).toEqual(['B']);
  });

  test('el descanso suma 1 punto y no cuenta como color', () => {
    const t = torneo([jugador('A', 1), jugador('B', 2), jugador('C', 3)], [
      { numero: 1, cerrada: true, descansa: 'C', mesas: [{ numero: 1, blancas: 'A', negras: 'B', resultado: '1-0' }] },
    ]);
    const c = estadisticas(t).get('C')!;
    expect(c.puntos).toBe(1);
    expect(c.descansos).toBe(1);
    expect(c.blancas + c.negras).toBe(0);
  });

  test('hastaRonda limita las rondas consideradas', () => {
    expect(estadisticas(base, 1).get('A')!.puntos).toBe(1);
  });
});

describe('clasificacion', () => {
  test('ordena por puntos y luego por Buchholz', () => {
    expect(clasificacion(base).map((f) => f.jugador.id)).toEqual(['A', 'C', 'B', 'D']);
    expect(clasificacion(base).map((f) => f.puesto)).toEqual([1, 2, 3, 4]);
  });

  test('desempata por ELO (sin ELO al final) y luego por orden de inscripción', () => {
    const t = torneo([jugador('X', 1, null), jugador('Y', 2, 1500), jugador('Z', 3, null), jugador('W', 4, 1600)], []);
    expect(clasificacion(t).map((f) => f.jugador.id)).toEqual(['W', 'Y', 'X', 'Z']);
  });

  test('incluye a los retirados', () => {
    const t = structuredClone(base);
    t.jugadores[3].retirado = true;
    expect(clasificacion(t)).toHaveLength(4);
  });
});
