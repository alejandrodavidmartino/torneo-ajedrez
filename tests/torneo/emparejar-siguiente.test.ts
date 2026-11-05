import { describe, expect, test } from 'vitest';
import { emparejarSiguiente } from '../../src/torneo/emparejar';
import { jug, ronda, torneo } from './ayudas';

const cuatro = [jug('A', 1, 2000), jug('B', 2, 1900), jug('C', 3, 1800), jug('D', 4, 1700)];
const parejas = (r: { mesas: { blancas: string; negras: string }[] }) =>
  r.mesas.map((m) => [m.blancas, m.negras].sort().join('-'));

describe('emparejarSiguiente', () => {
  test('empareja dentro de cada grupo de puntos', () => {
    const t = torneo(cuatro, [ronda(1, [['A', 'B', '1-0'], ['D', 'C', '0-1']])]);
    const r = emparejarSiguiente(t)!;
    expect(r.numero).toBe(2);
    expect(r.cerrada).toBe(false);
    expect(parejas(r)).toEqual(['A-C', 'B-D']);
  });

  test('quien lleva dos blancas seguidas juega con negras', () => {
    const t = torneo(cuatro, [
      ronda(1, [['A', 'B', '1-0'], ['C', 'D', '1-0']]),
      ronda(2, [['A', 'C', '½-½'], ['D', 'B', '1-0']]),
    ]);
    const r = emparejarSiguiente(t)!;
    const mesaA = r.mesas.find((m) => m.blancas === 'A' || m.negras === 'A')!;
    expect(mesaA.negras).toBe('A');
    expect(mesaA.blancas).toBe('D');
  });

  test('nadie descansa dos veces', () => {
    const cinco = [...cuatro, jug('E', 5, 1600)];
    const t = torneo(cinco, [ronda(1, [['A', 'C', '1-0'], ['B', 'D', '1-0']], 'E')]);
    const r = emparejarSiguiente(t)!;
    expect(r.descansa).not.toBeNull();
    expect(r.descansa).not.toBe('E');
    expect(r.mesas).toHaveLength(2);
  });

  test('un retirado no vuelve a aparecer y el descanso se reasigna', () => {
    const seis = [...cuatro, jug('E', 5, 1600), jug('F', 6, 1500)];
    const t = torneo(seis, [ronda(1, [['A', 'D', '1-0'], ['B', 'E', '1-0'], ['C', 'F', '1-0']])]);
    t.jugadores.find((j) => j.id === 'F')!.retirado = true;
    const r = emparejarSiguiente(t)!;
    expect(r.mesas).toHaveLength(2);
    expect(r.descansa).not.toBeNull();
    const aparecen = [r.descansa, ...r.mesas.flatMap((m) => [m.blancas, m.negras])];
    expect(aparecen).not.toContain('F');
    expect(new Set(aparecen).size).toBe(5);
  });

  test('separa a dos líderes que necesitan el mismo color', () => {
    const t = torneo(cuatro, [ronda(1, [['A', 'B', '1-0'], ['C', 'D', '1-0']])]);
    const r = emparejarSiguiente(t)!;
    expect(parejas(r)).toEqual(['A-D', 'B-C']);
    expect(r.mesas[0].negras).toBe('A');
  });

  test('devuelve null si no se puede evitar repetir rival', () => {
    const t = torneo(cuatro, [
      ronda(1, [['A', 'B', '1-0'], ['C', 'D', '1-0']]),
      ronda(2, [['A', 'C', '1-0'], ['B', 'D', '1-0']]),
      ronda(3, [['D', 'A', '0-1'], ['C', 'B', '1-0']]),
    ]);
    expect(emparejarSiguiente(t)).toBeNull();
  });

  test('las mesas se numeran desde el mejor clasificado', () => {
    const t = torneo(cuatro, [ronda(1, [['A', 'B', '0-1'], ['D', 'C', '1-0']])]);
    const r = emparejarSiguiente(t)!;
    expect(r.mesas.map((m) => m.numero)).toEqual([1, 2]);
    expect([r.mesas[0].blancas, r.mesas[0].negras].sort()).toEqual(['B', 'D']);
  });
});
