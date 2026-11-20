import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { exportar } from '../../src/torneo/copia';
import { App } from '../../src/ui/App';
import { torneoEnCurso } from '../torneo/ayudas';
import { empezarTorneoUI } from './ayudas-ui';

const mesas = () => screen.getAllByRole('group', { name: /^Mesa \d+$/ });

function cargarArchivo(contenido: string) {
  const archivo = new File([contenido], 'copia.json', { type: 'application/json' });
  fireEvent.change(screen.getByLabelText('Cargar copia'), { target: { files: [archivo] } });
}

describe('ajustes', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test('cargar un archivo inválido avisa y no toca el torneo actual', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    const antes = mesas().map((m) => m.textContent);
    cargarArchivo('hola');
    expect((await screen.findByRole('alert')).textContent).toBe('El archivo no es una copia válida de un torneo.');
    expect(mesas().map((m) => m.textContent)).toEqual(antes);
  });

  test('cargar una copia pide confirmación y, si se cancela, no cambia nada', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    cargarArchivo(exportar(torneoEnCurso()));
    await new Promise((r) => setTimeout(r, 20));
    expect(confirmar).toHaveBeenCalledWith('¿Cargar esta copia? Se sustituirá el torneo actual.');
    expect(screen.queryByText('Pilar')).toBeNull();
  });

  test('si el torneo guardado no se puede leer, se avisa', () => {
    localStorage.setItem('torneo-lucero:v1', '{"version":99}');
    render(<App />);
    expect(screen.getByRole('alert').textContent).toBe(
      'No se ha podido leer el torneo guardado en este aparato. Si tienes una copia descargada, cárgala.',
    );
  });

  test('cargar una copia válida sustituye el torneo', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    cargarArchivo(exportar(torneoEnCurso()));
    expect((await screen.findAllByText('Pilar')).length).toBeGreaterThan(0);
  });

  test('nuevo torneo pide confirmación', () => {
    render(<App />);
    empezarTorneoUI(['Ana', 'Luis'], '1');
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo torneo' }));
    expect(confirmar).toHaveBeenCalledWith('¿Empezar un torneo nuevo? Descarga antes la copia si quieres conservar este.');
    expect(mesas()).toHaveLength(1);
    confirmar.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo torneo' }));
    expect(screen.getByLabelText('Nombre del torneo')).toBeTruthy();
  });
});
