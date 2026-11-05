import { cleanup, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { App } from '../../src/ui/App';
import { empezarTorneoUI } from './ayudas-ui';

describe('preparado para imprimir', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  test('partidas y clasificación se imprimen; botones y ajustes no', () => {
    const { container } = render(<App />);
    empezarTorneoUI(['Ana', 'Luis', 'Marta', 'Jorge']);
    expect(container.querySelector('.partidas.imprimible')).not.toBeNull();
    expect(container.querySelector('.clasificacion.imprimible')).not.toBeNull();
    expect(container.querySelector('.ajustes.solo-pantalla')).not.toBeNull();
    expect(container.querySelectorAll('.botones-resultado.solo-pantalla')).toHaveLength(2);
    expect(container.querySelectorAll('.resultado-impreso')).toHaveLength(2);
  });

  test('la página declara el manifiesto de la app', async () => {
    const html = await import('../../index.html?raw');
    expect(html.default).toContain('<meta name="theme-color" content="#111111"');
    expect(html.default).toContain('apple-touch-icon');
  });
});
