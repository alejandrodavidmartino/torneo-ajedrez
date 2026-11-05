import { describe, expect, test } from 'vitest';
import { crearTorneo } from '../../src/torneo/acciones';
import { exportar, importar, nombreArchivo } from '../../src/torneo/copia';
import { ErrorTorneo } from '../../src/torneo/tipos';
import { torneoEnCurso } from './ayudas';

function mensajeDe(fn: () => unknown): string {
  try { fn(); } catch (e) { if (e instanceof ErrorTorneo) return e.message; throw e; }
  throw new Error('no lanzó');
}

describe('copia de seguridad', () => {
  test('exportar e importar devuelve el mismo torneo', () => {
    const t = torneoEnCurso();
    expect(importar(exportar(t))).toEqual(t);
  });

  test.each([
    ['vacío', '{}'],
    ['no es JSON', 'no json'],
    ['otra versión', JSON.stringify({ ...torneoEnCurso(), version: 2 })],
    ['jugador desconocido en una mesa', JSON.stringify((() => { const t = torneoEnCurso(); t.rondas[0].mesas[0].blancas = 'zzz'; return t; })())],
    ['resultado inválido', JSON.stringify((() => { const t = torneoEnCurso(); (t.rondas[0].mesas[0] as { resultado: unknown }).resultado = '2-0'; return t; })())],
    ['estado inválido', JSON.stringify({ ...torneoEnCurso(), estado: 'otro' })],
  ])('rechaza un archivo %s', (_, texto) => {
    expect(mensajeDe(() => importar(texto))).toBe('El archivo no es una copia válida de un torneo.');
  });

  test('nombreArchivo usa el nombre del torneo y la fecha', () => {
    const t = crearTorneo('Torneo de otoño', 3, 1);
    expect(nombreArchivo(t, new Date(2026, 10, 5))).toBe('torneo-torneo-de-otono-2026-11-05.json');
  });
});
