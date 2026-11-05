import { describe, expect, test } from 'vitest';
import { emparejarPrimera } from '../../src/torneo/emparejar';
import type { Jugador } from '../../src/torneo/tipos';

const j = (id: string, orden: number, elo: number | null): Jugador => ({ id, nombre: id, elo, orden, retirado: false });

const seis = [j('p6', 1, 1500), j('p1', 2, 2000), j('p4', 3, 1700), j('p2', 4, 1900), j('p5', 5, 1600), j('p3', 6, 1800)];

const parejas = (r: ReturnType<typeof emparejarPrimera>) =>
  r.mesas.map((m) => [m.blancas, m.negras].sort());

describe('emparejarPrimera', () => {
  test('empareja la mitad de arriba con la de abajo por ELO', () => {
    const r = emparejarPrimera(seis, 1);
    expect(parejas(r)).toEqual([['p1', 'p4'], ['p2', 'p5'], ['p3', 'p6']]);
    expect(r.numero).toBe(1);
    expect(r.cerrada).toBe(false);
    expect(r.descansa).toBeNull();
    expect(r.mesas.every((m) => m.resultado === null)).toBe(true);
    expect(r.mesas.map((m) => m.numero)).toEqual([1, 2, 3]);
  });

  test('con número impar descansa el de menor ELO', () => {
    const r = emparejarPrimera(seis.filter((x) => x.id !== 'p3'), 1);
    expect(r.descansa).toBe('p6');
    expect(r.mesas).toHaveLength(2);
  });

  test('los jugadores sin ELO van al final por orden de inscripción', () => {
    const lista = [j('sin1', 1, null), j('con', 2, 1400), j('sin2', 3, null), j('sin3', 4, null)];
    expect(parejas(emparejarPrimera(lista, 1))).toEqual([['con', 'sin2'], ['sin1', 'sin3']]);
  });

  test('misma semilla, misma ronda', () => {
    expect(emparejarPrimera(seis, 42)).toEqual(emparejarPrimera(seis, 42));
  });

  test('la semilla decide el color de la mesa 1', () => {
    const colores = new Set<string>();
    for (let s = 0; s <= 20; s++) colores.add(emparejarPrimera(seis, s).mesas[0].blancas);
    expect(colores).toEqual(new Set(['p1', 'p4']));
  });

  test('los colores se alternan de mesa en mesa', () => {
    for (let s = 0; s < 10; s++) {
      const r = emparejarPrimera(seis, s);
      const arribaConBlancas = r.mesas.map((m) => ['p1', 'p2', 'p3'].includes(m.blancas));
      expect(arribaConBlancas[1]).toBe(!arribaConBlancas[0]);
      expect(arribaConBlancas[2]).toBe(arribaConBlancas[0]);
    }
  });
});
