import { describe, expect, test } from 'vitest';
import {
  avisoRondas, borrarJugador, crearTorneo, deshacerRonda, editarJugador, empezar, fijarRondas,
  inscribir, reactivar, registrarResultado, retirar, siguienteRonda, terminarAntes,
} from '../../src/torneo/acciones';
import { clasificacion } from '../../src/torneo/calculos';
import { ErrorTorneo, type Torneo } from '../../src/torneo/tipos';

function congelar<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.values(o).forEach(congelar);
    Object.freeze(o);
  }
  return o;
}

function codigo(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErrorTorneo) return `${e.codigo}: ${e.message}`;
    throw e;
  }
  throw new Error('no lanzó ErrorTorneo');
}

function conJugadores(nombres: string[], rondas = 3): Torneo {
  let t = crearTorneo('Torneo de otoño', rondas, 7);
  nombres.forEach((n, i) => (t = inscribir(t, n, String(2000 - i * 100))));
  return congelar(t);
}

function completarRonda(t: Torneo, r: '1-0' | '0-1' = '1-0'): Torneo {
  const ronda = t.rondas.at(-1)!;
  for (const m of ronda.mesas) t = registrarResultado(t, ronda.numero, m.numero, r);
  return t;
}

describe('inscripción', () => {
  test('crearTorneo empieza en inscripción sin jugadores', () => {
    const t = crearTorneo('Torneo de otoño', 5, 3);
    expect(t).toMatchObject({ version: 1, nombre: 'Torneo de otoño', rondasTotales: 5, semilla: 3, estado: 'inscripcion', jugadores: [], rondas: [] });
  });

  test('inscribir recorta espacios y convierte el ELO', () => {
    const t = inscribir(crearTorneo('T', 3, 1), '  Ana Gómez ', '1650');
    expect(t.jugadores[0]).toMatchObject({ nombre: 'Ana Gómez', elo: 1650, orden: 1, retirado: false });
    expect(inscribir(t, 'Luis', '').jugadores[1].elo).toBeNull();
  });

  test.each(['', '   '])('rechaza el nombre vacío %j', (nombre) => {
    const t = conJugadores(['Ana']);
    expect(codigo(() => inscribir(t, nombre, ''))).toBe('nombre-vacio: Escribe el nombre del jugador.');
  });

  test('rechaza nombres repetidos sin distinguir mayúsculas ni espacios', () => {
    const t = conJugadores(['Ana']);
    expect(codigo(() => inscribir(t, 'ana ', ''))).toBe('nombre-repetido: Ya hay un jugador con ese nombre.');
    expect(t.jugadores).toHaveLength(1);
  });

  test.each(['abc', '-5', '1500.5', '3501'])('rechaza el ELO %j', (elo) => {
    const t = conJugadores(['Ana']);
    expect(codigo(() => inscribir(t, 'Luis', elo))).toBe(
      'elo-invalido: El ELO tiene que ser un número entre 0 y 3500, o dejarlo vacío.',
    );
  });

  test('editar y borrar jugadores', () => {
    let t = conJugadores(['Ana', 'Luis']);
    t = editarJugador(t, t.jugadores[1].id, 'Luis Pérez', '');
    expect(t.jugadores[1]).toMatchObject({ nombre: 'Luis Pérez', elo: null });
    expect(codigo(() => editarJugador(t, t.jugadores[1].id, 'ANA', ''))).toMatch(/^nombre-repetido/);
    expect(editarJugador(t, t.jugadores[0].id, 'ana', '').jugadores[0].nombre).toBe('ana');
    expect(borrarJugador(t, t.jugadores[0].id).jugadores.map((j) => j.nombre)).toEqual(['Luis Pérez']);
  });

  test('no se pueden cambiar jugadores con el torneo empezado', () => {
    const t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    const msg = 'torneo-empezado: El torneo ya ha empezado: no se pueden cambiar los jugadores.';
    expect(codigo(() => inscribir(t, 'E', ''))).toBe(msg);
    expect(codigo(() => editarJugador(t, t.jugadores[0].id, 'X', ''))).toBe(msg);
    expect(codigo(() => borrarJugador(t, t.jugadores[0].id))).toBe(msg);
  });
});

describe('empezar', () => {
  test('hacen falta al menos 2 jugadores', () => {
    expect(codigo(() => empezar(conJugadores(['A'])))).toBe('pocos-jugadores: Hacen falta al menos 2 jugadores.');
  });

  test('las rondas tienen que estar entre 1 y n−1', () => {
    expect(codigo(() => empezar(conJugadores(['A', 'B', 'C', 'D'], 4)))).toBe(
      'rondas-invalidas: Con 4 jugadores puedes jugar entre 1 y 3 rondas.',
    );
    expect(codigo(() => fijarRondas(conJugadores(['A']), 0))).toMatch(/^rondas-invalidas/);
    expect(fijarRondas(conJugadores(['A']), 4).rondasTotales).toBe(4);
  });

  test('genera la ronda 1 y pasa a en curso', () => {
    const t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    expect(t.estado).toBe('en-curso');
    expect(t.rondas).toHaveLength(1);
    expect(t.rondas[0].mesas).toHaveLength(2);
  });

  test('avisoRondas avisa cuando hay muchas rondas', () => {
    expect(avisoRondas(8, 4)).toBeNull();
    expect(avisoRondas(8, 5)).toBe('Con tantas rondas puede que al final no se puedan evitar rivales repetidos.');
  });
});

describe('rondas', () => {
  test('flujo completo de 4 jugadores y 3 rondas', () => {
    let t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    expect(codigo(() => siguienteRonda(t))).toBe('faltan-resultados: Faltan resultados por apuntar.');
    t = siguienteRonda(completarRonda(t));
    expect(t.rondas[0].cerrada).toBe(true);
    expect(t.rondas).toHaveLength(2);
    t = siguienteRonda(completarRonda(t));
    t = siguienteRonda(completarRonda(t));
    expect(t.estado).toBe('terminado');
    expect(t.rondas).toHaveLength(3);
    expect(t.rondas.every((r) => r.cerrada)).toBe(true);
  });

  test('quitar un resultado deja la mesa pendiente', () => {
    let t = empezar(conJugadores(['A', 'B'], 1));
    t = registrarResultado(t, 1, 1, '1-0');
    t = registrarResultado(t, 1, 1, null);
    expect(t.rondas[0].mesas[0].resultado).toBeNull();
  });

  test('corregir una ronda cerrada cambia la clasificación pero no los emparejamientos', () => {
    let t = empezar(conJugadores(['A', 'B', 'C', 'D', 'E', 'F']));
    t = siguienteRonda(completarRonda(t));
    t = congelar(completarRonda(t, '0-1'));
    const mesasR2 = structuredClone(t.rondas[1].mesas);
    const antes = clasificacion(t).map((f) => f.est.puntos);
    const m = t.rondas[0].mesas[0];
    const corregido = registrarResultado(t, 1, m.numero, '0-1');
    expect(corregido.rondas[1].mesas).toEqual(mesasR2);
    expect(clasificacion(corregido).map((f) => f.est.puntos)).not.toEqual(antes);
  });

  test('una incomparecencia en la ronda actual retira al ausente', () => {
    let t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    const m = t.rondas[0].mesas[0];
    t = registrarResultado(t, 1, m.numero, '1F-0F');
    expect(t.jugadores.find((j) => j.id === m.negras)!.retirado).toBe(true);
    expect(t.jugadores.find((j) => j.id === m.blancas)!.retirado).toBe(false);
  });

  test('retirar y reactivar', () => {
    const t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    const id = t.jugadores[0].id;
    expect(retirar(t, id).jugadores[0].retirado).toBe(true);
    expect(reactivar(retirar(t, id), id).jugadores[0].retirado).toBe(false);
  });

  test('deshacer ronda sin resultados reabre la anterior', () => {
    let t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    expect(codigo(() => deshacerRonda(t))).toBe('no-se-puede-deshacer: Solo puedes deshacer una ronda sin resultados.');
    t = siguienteRonda(completarRonda(t));
    t = deshacerRonda(t);
    expect(t.rondas).toHaveLength(1);
    expect(t.rondas[0].cerrada).toBe(false);
    t = siguienteRonda(t);
    t = registrarResultado(t, 2, 1, '1-0');
    expect(codigo(() => deshacerRonda(t))).toMatch(/^no-se-puede-deshacer/);
  });

  test('sin emparejamiento posible lanza un error explicativo', () => {
    let t = empezar(conJugadores(['A', 'B', 'C', 'D']));
    t = siguienteRonda(completarRonda(t));
    t = siguienteRonda(completarRonda(t));
    t = { ...t, rondasTotales: 5 };
    t = completarRonda(t);
    // Tras 3 rondas todos han jugado contra todos
    expect(codigo(() => siguienteRonda(t))).toBe(
      'sin-emparejamiento: No hay forma de emparejar otra ronda sin repetir rivales. Puedes terminar el torneo aquí.',
    );
    const fin = terminarAntes(t);
    expect(fin.estado).toBe('terminado');
    expect(fin.rondasTotales).toBe(3);
    expect(fin.rondas.every((r) => r.cerrada)).toBe(true);
  });
});
