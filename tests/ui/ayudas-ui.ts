import { fireEvent, screen } from '@testing-library/preact';

export function crearTorneoUI(nombre = 'Torneo de otoño', rondas = '3') {
  fireEvent.input(screen.getByLabelText('Nombre del torneo'), { target: { value: nombre } });
  fireEvent.input(screen.getByLabelText('Número de rondas'), { target: { value: rondas } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear torneo' }));
}

export function anadirJugador(nombre: string, elo = '') {
  fireEvent.input(screen.getByLabelText('Nombre'), { target: { value: nombre } });
  fireEvent.input(screen.getByLabelText('ELO (opcional)'), { target: { value: elo } });
  fireEvent.click(screen.getByRole('button', { name: 'Añadir jugador' }));
}

/** Crea un torneo con los jugadores indicados y lo empieza. */
export function empezarTorneoUI(nombres: string[], rondas = '3') {
  crearTorneoUI('Torneo de otoño', rondas);
  nombres.forEach((n, i) => anadirJugador(n, String(2000 - i * 100)));
  fireEvent.click(screen.getByRole('button', { name: 'Empezar torneo' }));
}
