import { importar } from './torneo/copia';
import type { Torneo } from './torneo/tipos';

export const CLAVE = 'torneo-lucero:v1';

/** Recupera el torneo guardado en este navegador, o null si no hay ninguno válido. */
export function cargar(): Torneo | null {
  try {
    const texto = localStorage.getItem(CLAVE);
    return texto ? importar(texto) : null;
  } catch {
    return null;
  }
}

export function guardar(t: Torneo | null): void {
  try {
    if (t) localStorage.setItem(CLAVE, JSON.stringify(t));
    else localStorage.removeItem(CLAVE);
  } catch {
    // Almacenamiento no disponible (modo privado o bloqueado): la app sigue funcionando en memoria.
  }
}
