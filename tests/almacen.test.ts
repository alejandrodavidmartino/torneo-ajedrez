import { beforeEach, describe, expect, test } from 'vitest';
import { CLAVE, cargar, guardar } from '../src/almacen';
import { torneoEnCurso } from './torneo/ayudas';

describe('almacén local', () => {
  beforeEach(() => localStorage.clear());

  test('sin nada guardado devuelve null', () => {
    expect(cargar()).toBeNull();
  });

  test('recargar a mitad de ronda recupera exactamente el mismo torneo', () => {
    const t = torneoEnCurso();
    guardar(t);
    expect(cargar()).toEqual(t);
  });

  test('con datos corruptos devuelve null sin lanzar', () => {
    localStorage.setItem(CLAVE, '{basura');
    expect(cargar()).toBeNull();
  });

  test('guardar(null) borra el torneo', () => {
    guardar(torneoEnCurso());
    guardar(null);
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });
});
