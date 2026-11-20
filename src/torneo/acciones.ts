import { emparejarPrimera, emparejarSiguiente } from './emparejar';
import { ErrorTorneo, type Jugador, type Resultado, type Ronda, type Torneo } from './tipos';

const ELO_MAX = 3500;

function fallar(codigo: string, mensaje: string): never {
  throw new ErrorTorneo(codigo, mensaje);
}

function exigirInscripcion(t: Torneo): void {
  if (t.estado !== 'inscripcion') {
    fallar('torneo-empezado', 'El torneo ya ha empezado: no se pueden cambiar los jugadores.');
  }
}

function normalizar(nombre: string): string {
  return nombre.trim().toLocaleLowerCase('es');
}

function validarJugador(t: Torneo, nombre: string, elo: string, idPropio?: string): { nombre: string; elo: number | null } {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  if (!limpio) fallar('nombre-vacio', 'Escribe el nombre del jugador.');
  if (t.jugadores.some((j) => j.id !== idPropio && normalizar(j.nombre) === normalizar(limpio))) {
    fallar('nombre-repetido', 'Ya hay un jugador con ese nombre.');
  }
  const eloTexto = elo.trim();
  let eloNum: number | null = null;
  if (eloTexto) {
    if (!/^\d+$/.test(eloTexto) || Number(eloTexto) > ELO_MAX) {
      fallar('elo-invalido', `El ELO tiene que ser un número entre 0 y ${ELO_MAX}, o dejarlo vacío.`);
    }
    eloNum = Number(eloTexto);
  }
  return { nombre: limpio, elo: eloNum };
}

function validarRondas(n: number): void {
  if (!Number.isInteger(n) || n < 1) fallar('rondas-invalidas', 'El número de rondas tiene que ser 1 o más.');
}

function rondaActual(t: Torneo): Ronda | undefined {
  return t.rondas.at(-1);
}

function cambiarJugador(t: Torneo, id: string, cambios: Partial<Jugador>): Torneo {
  return { ...t, jugadores: t.jugadores.map((j) => (j.id === id ? { ...j, ...cambios } : j)) };
}

export function crearTorneo(nombre: string, rondasTotales: number, semilla = Math.floor(Math.random() * 2 ** 31)): Torneo {
  const limpio = nombre.trim();
  if (!limpio) fallar('nombre-torneo-vacio', 'Escribe el nombre del torneo.');
  validarRondas(rondasTotales);
  return { version: 1, nombre: limpio, rondasTotales, semilla, estado: 'inscripcion', jugadores: [], rondas: [] };
}

export function inscribir(t: Torneo, nombre: string, elo: string): Torneo {
  exigirInscripcion(t);
  const datos = validarJugador(t, nombre, elo);
  const orden = Math.max(0, ...t.jugadores.map((j) => j.orden)) + 1;
  return { ...t, jugadores: [...t.jugadores, { id: `j${orden}`, ...datos, orden, retirado: false }] };
}

export function editarJugador(t: Torneo, id: string, nombre: string, elo: string): Torneo {
  exigirInscripcion(t);
  return cambiarJugador(t, id, validarJugador(t, nombre, elo, id));
}

export function borrarJugador(t: Torneo, id: string): Torneo {
  exigirInscripcion(t);
  return { ...t, jugadores: t.jugadores.filter((j) => j.id !== id) };
}

export function fijarRondas(t: Torneo, n: number): Torneo {
  exigirInscripcion(t);
  validarRondas(n);
  return { ...t, rondasTotales: n };
}

export function avisoRondas(numJugadores: number, rondas: number): string | null {
  return rondas > numJugadores / 2
    ? 'Con tantas rondas puede que al final no se puedan evitar rivales repetidos.'
    : null;
}

export function empezar(t: Torneo): Torneo {
  exigirInscripcion(t);
  const n = t.jugadores.length;
  if (n < 2) fallar('pocos-jugadores', 'Hacen falta al menos 2 jugadores.');
  if (t.rondasTotales < 1 || t.rondasTotales > n - 1) {
    fallar('rondas-invalidas', `Con ${n} jugadores puedes jugar entre 1 y ${n - 1} rondas.`);
  }
  return { ...t, estado: 'en-curso', rondas: [emparejarPrimera(t.jugadores, t.semilla)] };
}

export function registrarResultado(t: Torneo, ronda: number, mesa: number, r: Resultado | null): Torneo {
  if (t.estado === 'inscripcion') fallar('torneo-sin-empezar', 'El torneo todavía no ha empezado.');
  const objetivo = t.rondas.find((x) => x.numero === ronda);
  const m = objetivo?.mesas.find((x) => x.numero === mesa);
  if (!objetivo || !m) fallar('mesa-inexistente', 'Esa mesa no existe.');

  let nuevo: Torneo = {
    ...t,
    rondas: t.rondas.map((x) =>
      x !== objetivo ? x : { ...x, mesas: x.mesas.map((y) => (y !== m ? y : { ...y, resultado: r })) },
    ),
  };
  const esActual = objetivo === rondaActual(t) && !objetivo.cerrada;
  // Si se corrige una incomparecencia apuntada por error, el jugador vuelve al torneo.
  if (esActual && m.resultado === '1F-0F' && r !== '1F-0F') nuevo = cambiarJugador(nuevo, m.negras, { retirado: false });
  if (esActual && m.resultado === '0F-1F' && r !== '0F-1F') nuevo = cambiarJugador(nuevo, m.blancas, { retirado: false });
  if (esActual && r === '1F-0F') nuevo = cambiarJugador(nuevo, m.negras, { retirado: true });
  if (esActual && r === '0F-1F') nuevo = cambiarJugador(nuevo, m.blancas, { retirado: true });
  return nuevo;
}

function cerrarActual(t: Torneo): Torneo {
  const actual = rondaActual(t);
  if (!actual || actual.cerrada) return t;
  if (actual.mesas.some((m) => m.resultado === null)) fallar('faltan-resultados', 'Faltan resultados por apuntar.');
  return { ...t, rondas: t.rondas.map((x) => (x === actual ? { ...x, cerrada: true } : x)) };
}

export function siguienteRonda(t: Torneo): Torneo {
  if (t.estado !== 'en-curso') fallar('torneo-no-en-curso', 'El torneo no está en curso.');
  const cerrado = cerrarActual(t);
  if (cerrado.rondas.length >= cerrado.rondasTotales) return { ...cerrado, estado: 'terminado' };
  const activos = cerrado.jugadores.filter((j) => !j.retirado);
  if (activos.length < 2) {
    fallar('pocos-activos', 'Quedan menos de 2 jugadores activos. Puedes terminar el torneo aquí.');
  }
  if (activos.length % 2 === 1) {
    const descansados = new Set(cerrado.rondas.map((r) => r.descansa));
    if (activos.every((j) => descansados.has(j.id))) {
      fallar('sin-descanso', 'Todos los jugadores que quedan ya han descansado una vez. Puedes terminar el torneo aquí.');
    }
  }
  const nueva = emparejarSiguiente(cerrado);
  if (!nueva) {
    fallar('sin-emparejamiento', 'No hay forma de emparejar otra ronda sin repetir rivales. Puedes terminar el torneo aquí.');
  }
  return { ...cerrado, rondas: [...cerrado.rondas, nueva] };
}

export function deshacerRonda(t: Torneo): Torneo {
  const actual = rondaActual(t);
  if (t.estado !== 'en-curso' || !actual || actual.numero === 1 || actual.mesas.some((m) => m.resultado !== null)) {
    fallar('no-se-puede-deshacer', 'Solo puedes deshacer una ronda sin resultados.');
  }
  const rondas = t.rondas.slice(0, -1);
  rondas[rondas.length - 1] = { ...rondas[rondas.length - 1], cerrada: false };
  return { ...t, rondas };
}

export function retirar(t: Torneo, id: string): Torneo {
  return cambiarJugador(t, id, { retirado: true });
}

export function reactivar(t: Torneo, id: string): Torneo {
  return cambiarJugador(t, id, { retirado: false });
}

/**
 * Termina el torneo en la última ronda completa. Si la ronda en curso tiene
 * todos los resultados, se cierra y cuenta; si no, se descarta.
 */
export function terminarAntes(t: Torneo): Torneo {
  const actual = rondaActual(t);
  let rondas = t.rondas;
  if (actual && !actual.cerrada) {
    rondas = actual.mesas.every((m) => m.resultado !== null)
      ? rondas.map((x) => (x === actual ? { ...x, cerrada: true } : x))
      : rondas.slice(0, -1);
  }
  return { ...t, rondas, rondasTotales: rondas.length, estado: 'terminado' };
}
