import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { App } from '../../src/ui/App';

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

describe('inscripción', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  test('muestra el logo de la asociación', () => {
    render(<App />);
    expect(screen.getByAltText('Asociación Vecinal Lucero')).toBeTruthy();
  });

  test('crear torneo y añadir 3 jugadores', () => {
    render(<App />);
    crearTorneoUI();
    anadirJugador('Ana Gómez', '1650');
    anadirJugador('Luis Pérez');
    anadirJugador('Marta Díaz', '1500');
    const filas = screen.getAllByRole('listitem');
    expect(filas).toHaveLength(3);
    expect(filas[1].textContent).toContain('sin ELO');
  });

  test('un nombre repetido muestra un aviso', () => {
    render(<App />);
    crearTorneoUI();
    anadirJugador('Ana');
    anadirJugador('Ana');
    expect(screen.getByRole('alert').textContent).toBe('Ya hay un jugador con ese nombre.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  test('empezar con un jugador muestra un aviso', () => {
    render(<App />);
    crearTorneoUI();
    anadirJugador('Ana');
    fireEvent.click(screen.getByRole('button', { name: 'Empezar torneo' }));
    expect(screen.getByRole('alert').textContent).toBe('Hacen falta al menos 2 jugadores.');
  });

  test('tras añadir, el foco vuelve al nombre y el formulario se vacía', () => {
    render(<App />);
    crearTorneoUI();
    anadirJugador('Ana', '1500');
    const nombre = screen.getByLabelText('Nombre') as HTMLInputElement;
    expect(document.activeElement).toBe(nombre);
    expect(nombre.value).toBe('');
  });

  test('se puede quitar un jugador', () => {
    render(<App />);
    crearTorneoUI();
    anadirJugador('Ana');
    anadirJugador('Luis');
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a Ana' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  test('el torneo sobrevive a una recarga', () => {
    const { unmount } = render(<App />);
    crearTorneoUI();
    anadirJugador('Ana');
    unmount();
    render(<App />);
    expect(screen.getByText('Ana')).toBeTruthy();
  });
});
