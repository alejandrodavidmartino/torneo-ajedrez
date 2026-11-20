import { ErrorTorneo, RESULTADOS, type Torneo } from './tipos';

const ESTADOS = ['inscripcion', 'en-curso', 'terminado'];

export function exportar(t: Torneo): string {
  return JSON.stringify(t, null, 2);
}

function invalido(): never {
  throw new ErrorTorneo('copia-invalida', 'El archivo no es una copia válida de un torneo.');
}

const esTexto = (x: unknown): x is string => typeof x === 'string';
const esEntero = (x: unknown): x is number => Number.isInteger(x);
const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Lee una copia de seguridad. Lanza `copia-invalida` si el contenido no es un torneo válido. */
export function importar(texto: string): Torneo {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    invalido();
  }
  if (!esObjeto(datos) || datos.version !== 1) invalido();
  const { nombre, rondasTotales, semilla, estado, jugadores, rondas } = datos;
  if (!esTexto(nombre) || !esEntero(rondasTotales) || !esEntero(semilla) || !ESTADOS.includes(estado as string)) invalido();
  if (!Array.isArray(jugadores) || !Array.isArray(rondas)) invalido();

  const ids = new Set<string>();
  for (const j of jugadores) {
    if (!esObjeto(j) || !esTexto(j.id) || !esTexto(j.nombre) || !j.nombre.trim() || !esEntero(j.orden) || typeof j.retirado !== 'boolean') invalido();
    if (j.elo !== null && !esEntero(j.elo)) invalido();
    if (ids.has(j.id)) invalido();
    ids.add(j.id);
  }
  rondas.forEach((r, i) => {
    if (!esObjeto(r) || r.numero !== i + 1 || typeof r.cerrada !== 'boolean' || !Array.isArray(r.mesas)) invalido();
    if (r.descansa !== null && !ids.has(r.descansa as string)) invalido();
    // Todas las rondas salvo la última están cerradas; si el torneo terminó, también la última.
    const esUltima = i === rondas.length - 1;
    if (!r.cerrada && (!esUltima || estado === 'terminado')) invalido();
    const enRonda = new Set<string>(r.descansa ? [r.descansa as string] : []);
    for (const m of r.mesas) {
      if (!esObjeto(m) || !esEntero(m.numero) || !ids.has(m.blancas as string) || !ids.has(m.negras as string)) invalido();
      if (m.resultado !== null && !RESULTADOS.includes(m.resultado as never)) invalido();
      for (const id of [m.blancas as string, m.negras as string]) {
        if (enRonda.has(id)) invalido();
        enRonda.add(id);
      }
    }
  });
  // Coherencia entre el estado y las rondas.
  if (estado === 'inscripcion' ? rondas.length > 0 : rondas.length === 0) invalido();
  if (rondasTotales < Math.max(1, rondas.length)) invalido();
  return datos as unknown as Torneo;
}

export function nombreArchivo(t: Torneo, fecha: Date): string {
  const slug = t.nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const dos = (n: number) => String(n).padStart(2, '0');
  return `torneo-${slug}-${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}.json`;
}
