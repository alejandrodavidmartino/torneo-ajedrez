/** Resultado de una mesa. `F` indica incomparecencia: `1F-0F` = no se presentó negras. */
export type Resultado = '1-0' | '½-½' | '0-1' | '1F-0F' | '0F-1F';
export type Color = 'B' | 'N';

export interface Jugador {
  id: string;
  nombre: string;
  elo: number | null;
  /** Orden de inscripción, empezando en 1. */
  orden: number;
  retirado: boolean;
}

export interface Mesa {
  numero: number;
  blancas: string;
  negras: string;
  resultado: Resultado | null;
}

export interface Ronda {
  numero: number;
  mesas: Mesa[];
  descansa: string | null;
  cerrada: boolean;
}

export type Estado = 'inscripcion' | 'en-curso' | 'terminado';

export interface Torneo {
  version: 1;
  nombre: string;
  rondasTotales: number;
  semilla: number;
  estado: Estado;
  jugadores: Jugador[];
  rondas: Ronda[];
}

export const RESULTADOS: readonly Resultado[] = ['1-0', '½-½', '0-1', '1F-0F', '0F-1F'];

export class ErrorTorneo extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorTorneo';
  }
}
