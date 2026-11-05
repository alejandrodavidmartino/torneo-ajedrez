import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { App } from '../../src/ui/App';
import { anadirJugador, crearTorneoUI } from './ayudas-ui';

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

  test('lee lo escrito aunque el navegador no avise (autocompletado)', () => {
    render(<App />);
    (screen.getByLabelText('Nombre del torneo') as HTMLInputElement).value = 'Torneo de otoño';
    fireEvent.click(screen.getByRole('button', { name: 'Crear torneo' }));
    (screen.getByLabelText('Nombre') as HTMLInputElement).value = 'Ana';
    fireEvent.click(screen.getByRole('button', { name: 'Añadir jugador' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
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
