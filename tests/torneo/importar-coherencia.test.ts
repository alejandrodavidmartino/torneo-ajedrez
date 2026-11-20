import { beforeEach, describe, expect, test } from 'vitest';
import { CLAVE, CLAVE_DANADO, cargar } from '../../src/almacen';
import { importar } from '../../src/torneo/copia';
import type { Torneo } from '../../src/torneo/tipos';
import { torneoEnCurso } from './ayudas';

function variante(cambiar: (t: Torneo) => void): string {
  const t = structuredClone(torneoEnCurso());
  cambiar(t);
  return JSON.stringify(t);
}

describe('importar rechaza copias incoherentes', () => {
  test.each([
    ['en curso sin rondas', (t: Torneo) => { t.rondas = []; }],
    ['en inscripción con rondas', (t: Torneo) => { t.estado = 'inscripcion'; }],
    ['jugador repetido en una ronda', (t: Torneo) => { t.rondas[0].mesas[1].blancas = t.rondas[0].mesas[0].blancas; }],
    ['el que descansa también juega', (t: Torneo) => { t.rondas[0].descansa = t.rondas[0].mesas[0].negras; }],
    ['nombre vacío', (t: Torneo) => { t.jugadores[0].nombre = '  '; }],
    ['rondas no consecutivas', (t: Torneo) => { t.rondas[0].numero = 2; }],
    ['más rondas jugadas que previstas', (t: Torneo) => { t.rondasTotales = 0; }],
    ['ronda anterior abierta', (t: Torneo) => { t.rondas.push({ ...structuredClone(t.rondas[0]), numero: 2 }); }],
  ])('%s', (_, cambiar) => {
    expect(() => importar(variante(cambiar))).toThrow('El archivo no es una copia válida de un torneo.');
  });
});

describe('cargar no borra datos dañados', () => {
  beforeEach(() => localStorage.clear());

  test('aparta el contenido ilegible en otra clave antes de descartarlo', () => {
    localStorage.setItem(CLAVE, '{"version":2}');
    expect(cargar()).toBeNull();
    expect(localStorage.getItem(CLAVE_DANADO)).toBe('{"version":2}');
  });
});
