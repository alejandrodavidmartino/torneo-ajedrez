import { describe, expect, test } from 'vitest';
import { PARTIDA, desdeFen, posicionFinal } from '../../src/ui/tablero';

const cuenta = (pos: (string | null)[], pieza: string) => pos.filter((p) => p === pieza).length;

describe('minitablero', () => {
  test('desdeFen lee la posición inicial', () => {
    const pos = desdeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    expect(pos).toHaveLength(64);
    expect(pos[0]).toBe('r'); // a8
    expect(pos[60]).toBe('K'); // e1
    expect(cuenta(pos, 'P')).toBe(8);
    expect(cuenta(pos, null as unknown as string)).toBe(32);
  });

  test('la partida de ejemplo tiene jugadas legibles y cada una mueve una pieza', () => {
    expect(PARTIDA.length).toBeGreaterThan(8);
    for (const paso of PARTIDA) {
      expect(paso.posicion).toHaveLength(64);
      expect(paso.posicion[paso.hasta]).not.toBeNull();
      expect(paso.posicion[paso.desde]).toBeNull();
    }
  });

  test('si ganan blancas, el rey negro queda frente a piezas blancas que dan mate', () => {
    const { posicion, etiqueta } = posicionFinal('1-0');
    expect(etiqueta).toBe('Ganan blancas');
    expect(cuenta(posicion, 'k')).toBe(1);
    expect(cuenta(posicion, 'R')).toBe(1);
    expect(cuenta(posicion, 'r')).toBe(0);
  });

  test('si ganan negras, es el espejo', () => {
    const { posicion, etiqueta } = posicionFinal('0-1');
    expect(etiqueta).toBe('Ganan negras');
    expect(cuenta(posicion, 'r')).toBe(1);
    expect(cuenta(posicion, 'R')).toBe(0);
  });

  test('en tablas quedan solo los dos reyes', () => {
    const { posicion, etiqueta } = posicionFinal('½-½');
    expect(etiqueta).toBe('Tablas');
    expect(posicion.filter((p) => p !== null).sort()).toEqual(['K', 'k']);
  });

  test('en una incomparecencia solo están las piezas del que se presentó', () => {
    const blancas = posicionFinal('1F-0F').posicion;
    expect(blancas.some((p) => p !== null && p === p.toLowerCase())).toBe(false);
    expect(cuenta(blancas, 'K')).toBe(1);
    const negras = posicionFinal('0F-1F').posicion;
    expect(negras.some((p) => p !== null && p === p.toUpperCase())).toBe(false);
  });
});
