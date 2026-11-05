import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { App } from '../../src/ui/App';
import { empezarTorneoUI } from './ayudas-ui';

const mesas = () => screen.getAllByRole('group', { name: /^Mesa \d+$/ });

describe('pantalla de ronda', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  test('con 4 jugadores hay 2 mesas en la ronda 1', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    expect(screen.getByRole('heading', { name: 'Ronda 1' })).toBeTruthy();
    expect(mesas()).toHaveLength(2);
    expect(screen.getByText('Faltan 2 resultados')).toBeTruthy();
  });

  test('no se puede pasar de ronda con resultados pendientes', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ronda' }));
    expect(screen.getByRole('alert').textContent).toBe('Faltan resultados por apuntar.');
  });

  test('apuntar todos los resultados y pasar a la ronda 2', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    for (const m of mesas()) fireEvent.click(within(m).getByRole('button', { name: '1–0' }));
    expect(screen.getByText('Todo apuntado')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ronda' }));
    expect(screen.getByRole('heading', { name: 'Ronda 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deshacer ronda' })).toBeTruthy();
  });

  test('dos resultados apuntados muy seguidos se guardan los dos', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    const [m1, m2] = mesas();
    const b1 = within(m1).getByRole('button', { name: '1–0' });
    const b2 = within(m2).getByRole('button', { name: '0–1' });
    act(() => {
      b1.click();
      b2.click();
    });
    expect(screen.getByText('Todo apuntado')).toBeTruthy();
  });

  test('pulsar dos veces el mismo resultado lo quita', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis'], '1');
    const boton = () => within(mesas()[0]).getByRole('button', { name: '1–0' });
    fireEvent.click(boton());
    expect(boton().getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(boton());
    expect(boton().getAttribute('aria-pressed')).toBe('false');
  });

  test('en la última ronda el botón termina el torneo', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis'], '1');
    fireEvent.click(within(mesas()[0]).getByRole('button', { name: '½' }));
    fireEvent.click(screen.getByRole('button', { name: 'Terminar torneo' }));
    expect(screen.getByRole('heading', { name: 'Clasificación final' })).toBeTruthy();
  });

  test('retirar a un jugador lo marca en la clasificación', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    fireEvent.click(screen.getByRole('button', { name: 'Retirar a Ana' }));
    expect(screen.getByText('(retirado)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reactivar a Ana' })).toBeTruthy();
  });

  test('una incomparecencia apunta el resultado', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    fireEvent.click(within(mesas()[0]).getByRole('button', { name: 'No se presentó negras' }));
    expect(within(mesas()[0]).getByText('Gana blancas por incomparecencia')).toBeTruthy();
    expect(screen.getByText('Falta 1 resultado')).toBeTruthy();
  });
});
