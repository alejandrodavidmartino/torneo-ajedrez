import { describe, expect, test } from 'vitest';
import { crearTorneo, empezar, inscribir, registrarResultado, retirar, siguienteRonda } from '../../src/torneo/acciones';
import { emparejarPrimera, emparejarSiguiente } from '../../src/torneo/emparejar';
import { ErrorTorneo, type Torneo } from '../../src/torneo/tipos';
import { jug, ronda, torneo } from './ayudas';

function codigo(fn: () => unknown): string {
  try { fn(); } catch (e) { if (e instanceof ErrorTorneo) return `${e.codigo}: ${e.message}`; throw e; }
  throw new Error('no lanzó ErrorTorneo');
}

describe('hallazgos de la revisión final', () => {
  test('retirar a jugadores de un mismo color no cuelga el emparejamiento (40 jugadores)', () => {
    const jugadores = Array.from({ length: 40 }, (_, i) => jug(`j${i + 1}`, i + 1, 2400 - i * 10));
    const r1 = emparejarPrimera(jugadores, 3);
    r1.mesas.forEach((m, i) => (m.resultado = i % 2 ? '1-0' : '0-1'));
    r1.cerrada = true;
    const t = torneo(jugadores, [r1], 9);
    const negras = r1.mesas.slice(0, 4).map((m) => m.negras);
    for (const id of negras) t.jugadores.find((j) => j.id === id)!.retirado = true;
    const inicio = performance.now();
    const r2 = emparejarSiguiente(t)!;
    expect(performance.now() - inicio).toBeLessThan(1000);
    expect(r2.mesas).toHaveLength(18);
    const enR1 = new Set(r1.mesas.map((m) => [m.blancas, m.negras].sort().join('|')));
    expect(r2.mesas.every((m) => !enR1.has([m.blancas, m.negras].sort().join('|')))).toBe(true);
  });

  test('60 jugadores con 10 retirados de negras se emparejan rápido', () => {
    const jugadores = Array.from({ length: 60 }, (_, i) => jug(`j${i + 1}`, i + 1, 2400 - i * 10));
    const r1 = emparejarPrimera(jugadores, 9);
    r1.mesas.forEach((m) => (m.resultado = '½-½'));
    r1.cerrada = true;
    const t = torneo(jugadores, [r1], 9);
    for (const m of r1.mesas.slice(0, 10)) t.jugadores.find((j) => j.id === m.negras)!.retirado = true;
    const inicio = performance.now();
    expect(emparejarSiguiente(t)!.mesas).toHaveLength(25);
    expect(performance.now() - inicio).toBeLessThan(1000);
  });

  test('si todos los activos ya han descansado, lo dice claramente', () => {
    const t: Torneo = {
      ...torneo([jug('A', 1), jug('B', 2), jug('C', 3)], [
        ronda(1, [['A', 'B', '1-0']], 'C'),
        ronda(2, [['C', 'A', '1-0']], 'B'),
        { ...ronda(3, [['B', 'C', '1-0']], 'A'), cerrada: false },
      ], 5),
    };
    expect(codigo(() => siguienteRonda(t))).toBe(
      'sin-descanso: Todos los jugadores que quedan ya han descansado una vez. Puedes terminar el torneo aquí.',
    );
  });

  test('con menos de 2 jugadores activos no se empareja otra ronda', () => {
    let t = crearTorneo('T', 3, 1);
    for (const n of ['A', 'B', 'C', 'D']) t = inscribir(t, n, '');
    t = empezar(t);
    for (const m of t.rondas[0].mesas) t = registrarResultado(t, 1, m.numero, '1-0');
    for (const id of ['j1', 'j2', 'j3']) t = retirar(t, id);
    expect(codigo(() => siguienteRonda(t))).toBe(
      'pocos-activos: Quedan menos de 2 jugadores activos. Puedes terminar el torneo aquí.',
    );
  });

  test('corregir una incomparecencia en la ronda actual reactiva al jugador', () => {
    let t = crearTorneo('T', 3, 1);
    for (const n of ['A', 'B', 'C', 'D']) t = inscribir(t, n, '');
    t = empezar(t);
    const m = t.rondas[0].mesas[0];
    t = registrarResultado(t, 1, m.numero, '1F-0F');
    t = registrarResultado(t, 1, m.numero, '1-0');
    expect(t.jugadores.find((j) => j.id === m.negras)!.retirado).toBe(false);
  });
});
