import { importar } from './torneo/copia';
import type { Torneo } from './torneo/tipos';

export const CLAVE = 'torneo-lucero:v1';
/** Aquí se aparta un torneo guardado que no se pudo leer, para no perderlo. */
export const CLAVE_DANADO = 'torneo-lucero:danado';

/**
 * Recupera el torneo guardado en este navegador, o null si no hay ninguno válido.
 * Si lo guardado no se puede leer, se aparta en CLAVE_DANADO antes de descartarlo.
 */
export function cargar(): Torneo | null {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CLAVE);
    return texto ? importar(texto) : null;
  } catch {
    try {
      if (texto) localStorage.setItem(CLAVE_DANADO, texto);
    } catch {
      // Sin almacenamiento disponible: no hay nada más que hacer.
    }
    return null;
  }
}

/** Como `cargar`, pero indica además si había un torneo guardado que no se pudo leer. */
export function cargarAlEmpezar(): { torneo: Torneo | null; danado: boolean } {
  let habia = false;
  try {
    habia = localStorage.getItem(CLAVE) !== null;
  } catch {
    // Sin almacenamiento: se empieza de cero.
  }
  const torneo = cargar();
  return { torneo, danado: habia && torneo === null };
}

export function guardar(t: Torneo | null): void {
  try {
    if (t) localStorage.setItem(CLAVE, JSON.stringify(t));
    else localStorage.removeItem(CLAVE);
  } catch {
    // Almacenamiento no disponible (modo privado o bloqueado): la app sigue funcionando en memoria.
  }
}
